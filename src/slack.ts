import * as Router from 'koa-router';
import * as request from 'request-promise-native';
import * as moment from 'moment';

import { BB_CHECK_INTERVAL, BB_DISABLE_CHECK } from './config';
import { SlashCmdBody, SlackMessageAttachment, Installation, StravaActivity } from './interfaces';
import { getActivitiesSince, getInstallationActivity } from './strava';
import { isMembers, isHelpRequest } from './utils/parse-text';
import { formatActivities } from './utils/format-activities';
import { database } from './database';
import {
  postHelp,
  postDidNotWork,
  handleDebugRequest,
  handleMembersRequest,
  handleClubRequest,
  handleRecentRequest,
} from './commands/index';
import { logger } from './logger';

const lp = `:slack: *Slack*: `;

export class Slack {
  // Format: [timestamp, count, timestamp, count, ...]
  private checkLog: Array<number> = [];

  constructor() {
    this.handleSlackIncoming = this.handleSlackIncoming.bind(this);
    this.periodicCheck = this.periodicCheck.bind(this);

    // Setup periodic check (every 30m)
    if (!BB_DISABLE_CHECK) {
      setTimeout(this.periodicCheck, 2500);
      setInterval(this.periodicCheck, 1000 * 60 * BB_CHECK_INTERVAL);
    } else {
      logger.log(`${lp} Regular check is disabled, not checking`);
    }
  }

  /**
   * Handles incoming Slack webhook requests
   *
   * @param {Router.IRouterContext} ctx
   * @param {() => Promise<any>} next
   */
  public async handleSlackIncoming(ctx: Router.IRouterContext, next: () => Promise<any>) {
    const text = ((ctx.request.body as SlashCmdBody).text || '').trim();

    if (isHelpRequest(text)) {
      return postHelp(ctx);
    }

    if (text.startsWith('clubs')) {
      return handleClubRequest(ctx, text);
    }

    if (text.includes('debug')) {
      return handleDebugRequest(ctx, text, this.checkLog);
    }

    if (text.includes('recent')) {
      return handleRecentRequest(ctx, text);
    }

    if (text.includes('check now')) {
      return this.handleCheckNowRequest(ctx);
    }

    if (isMembers(text)) {
      return handleMembersRequest(ctx);
    }

    return postDidNotWork(ctx);
  }

  /**
   * Check now!
   */
  public async handleCheckNowRequest(ctx: Router.IRouterContext) {
    logger.log(`${lp} Received check-now request, checking`);
    this.periodicCheck();

    ctx.body = {
      text: ':horse_racing: Got it, checking now!',
      response_type: 'ephemeral'
    };
  }

  /**
   * Adds a periodic check to the checkLog, allowing the debug
   * command to figure out what happened when.
   *
   * @param {moment.Moment} now
   * @param {number} count
   */
  private addToLastCheckedLog(now: moment.Moment, count: number) {
    logger.silly(`${lp} Updating last checked log (${now.toLocaleString()})`);

    if (this.checkLog.length > 100) {
      this.checkLog = this.checkLog.slice(2);
    }

    this.checkLog.push(now.valueOf(), count);
  }

  private async periodicCheck() {
    // Don't do anythign without a database
    if (!database.isConnected()) {
      console.warn(`${lp} Meant to perform periodic check, but database not connected`);
      return;
    }

    try {
      const installations = await database.getInstallations();

      for (const installation of installations) {
        await this.periodicCheckForInstallation(installation);
      }
    } catch (error) {
      logger.log(`${lp} Periodic check error`, error);
    }
  }

  /**
   * Log our findings about an activity
   *
   * @param {StravaActivity} activity
   * @param {boolean} alreadyPosted
   */
  private logActivityKnown(activity: StravaActivity, alreadyPosted: boolean) {
    const { athlete } = activity;
    const details = `(${athlete.firstname}, ${activity.type}, \`${activity.name}\`)`;
    const postOrNot = `, ${alreadyPosted ? 'not ' : ''}posting`;

    logger.log(`${lp} Activity \`${activity.id}\` ${details} known${postOrNot}`);
  }

  /**
   * This thing runs every now and then and checks for new activities
   *
   * @param {Installation} install
   */
  private async periodicCheckForInstallation(install: Installation) {
    const now = moment();
    const nowMinus3 = now.subtract(3, 'days');
    const { strava } = install;
    const activities = await getActivitiesSince(nowMinus3, strava.clubs);
    const activitiesToPost = [];

    logger.log(`${lp} Found ${activities.length} since ${nowMinus3.valueOf()}`);

    // We now have the activities for the last 7 days. Which ones did we already post?
    for (const activity of activities) {
      const alreadyPosted = !!strava.knownActivities.find(({ id }) => id === activity.id);
      this.logActivityKnown(activity, alreadyPosted);

      if (!alreadyPosted) {
        activitiesToPost.push(activity);
      }
    }

    if (activitiesToPost.length > 0) {
      strava.knownActivities.push(...activitiesToPost.map(getInstallationActivity));

      await this.postToChannel(install, formatActivities(activitiesToPost));
      await database.updateInstallation(install);
    }

    this.addToLastCheckedLog(now, activitiesToPost.length);
  }

  /**
   * Post a message to a webhook
   *
   * @param {Array<SlackMessageAttachment>} attachments
   */
  private async postToChannel(installation: Installation, attachments: Array<SlackMessageAttachment>) {
    const json = { attachments };
    const { slack } = installation;

    if (!slack.incomingWebhook.url) {
      logger.warn(`${lp} Team ${slack.teamId}: No Slack webhook configured, not posting`);
      return;
    }

    try {
      logger.silly(`${lp} Now posting to Slack`);

      await request.post(slack.incomingWebhook.url, { json });
    } catch (error) {
      logger.log(error);
    }
  }
}

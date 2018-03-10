import * as Router from 'koa-router';
import * as request from 'request-promise-native';
import * as moment from 'moment';

import { BB_CHECK_INTERVAL, BB_DISABLE_CHECK } from './config';
import { SlashCmdBody, SlackMessageAttachment, Installation } from './interfaces';
import { getActivitiesSince } from './strava';
import { isMembers } from './utils/parse-text';
import { formatActivities } from './utils/format-activities';
import { database } from './database';

import { isHelpRequest, postHelp, postDidNotWork } from './commands/help';
import { handleClubRequest } from './commands/club';
import { handleDebugRequest } from './commands/debug';
import { handleMembersRequest } from './commands/members';
import { handleRecentRequest } from './commands/recent';


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
      console.log(`Regular check is disabled`);
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
      return handleDebugRequest(ctx, this.checkLog);
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
   *
   * @param {Router.IRouterContext} ctx
   */
  private async handleCheckNowRequest(ctx: Router.IRouterContext) {
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
    if (this.checkLog.length > 100) {
      this.checkLog = this.checkLog.slice(2);
    }

    this.checkLog.push(now.valueOf(), count);
  }

  private async periodicCheck() {
    // Don't do anythign without a database
    if (!database.isConnected()) {
      console.warn(`Meant to perform periodic check, but database not connected`);
      return;
    }

    try {
      const installations = await database.getInstallations();

      for (const installation of installations) {
        await this.periodicCheckForInstallation(installation);
      }
    } catch (error) {
      console.log(`Periodic check error`, error);
    }
  }

  /**
   * This thing runs every now and then and checks for new activities
   *
   * @param {Installation} installation
   */
  private async periodicCheckForInstallation(installation: Installation) {
    const now = moment();
    const nowMinus7 = now.subtract(7, 'days');
    const { strava } = installation;
    const activities = await getActivitiesSince(nowMinus7, strava.clubs);
    const activitiesToPost = [];

    console.log(`Found ${activities.length} since ${nowMinus7.valueOf()}`);

    // We now have the activities for the last 7 days. Which ones did we already post?
    for (const activity of activities) {
      const alreadyPosted = await database.hasActivity({ id: activity.id });
      console.log(`Acitivty ${activity.id} known: ${!!alreadyPosted}`);

      if (!alreadyPosted) {
        activitiesToPost.push(activity);
      }
    }

    if (activitiesToPost.length > 0) {
      await this.postToChannel(installation, formatActivities(activitiesToPost));
      await database.addActivities(activitiesToPost.map((a) => ({ id: a.id })));
    }

    this.addToLastCheckedLog(now, activitiesToPost.length);
    this.lastChecked = now;
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
      console.warn(`Team ${slack.teamId}: No Slack webhook configured, not posting`);
      return;
    }

    try {
      await request.post(slack.incomingWebhook.url, { json });
    } catch (error) {
      console.log(error);
    }
  }
}

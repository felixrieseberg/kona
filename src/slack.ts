import * as Router from 'koa-router';
import * as request from 'request-promise-native';
import * as moment from 'moment';
import * as multiline from 'multiline';

import { SLACK_WEBHOOK } from './config';
import { SlashCmdBody, SlackMessageAttachment, StravaActivity } from './interfaces';
import { getActivities, getActivitiesSince, SPORTS_EMOJI } from './strava';
import { metersToMiles, secondsToMinutes, metersPerSecondToMilesPace, metersPerSecondToPaceString } from './math';
import { isHelpRequest, postHelp, postDidNotWork } from './help';
import { isRecent, isRecentSince } from './utils/parse-text';
import { database } from './database';

interface StringMap<T> {
  [x: string]: T;
}

export class Slack {
  private slackClient: any;
  private lastChecked = moment();

  // Format: [timestamp, count, timestamp, count, ...]
  private checkLog: Array<number> = [];

  constructor() {
    this.handleSlackIncoming = this.handleSlackIncoming.bind(this);
    this.periodicCheck = this.periodicCheck.bind(this);

    // Setup periodic check (every 30m)
    setTimeout(this.periodicCheck, 2500);
    setInterval(this.periodicCheck, 1000 * 60 * 30);
  }

  /**
   * Handles incoming Slack webhook requests
   *
   * @param {Router.IRouterContext} ctx
   * @param {() => Promise<any>} next
   */
  public async handleSlackIncoming(ctx: Router.IRouterContext, next: () => Promise<any>) {
    const { response_url, token } = (ctx.request.body || {}) as SlashCmdBody;
    const { text } = ctx.request.body as SlashCmdBody;

    if (isHelpRequest(text)) {
      return postHelp(ctx);
    }

    if (text.trim().includes('debug')) {
      return this.handleDebugRequest(ctx);
    }

    if (text.trim().includes('recent')) {
      return this.handleRecentRequest(ctx, text.trim());
    }

    if (text.trim().includes('update last checked')) {
      return this.handleUpdateRequest(ctx, text.trim());
    }

    return postDidNotWork(ctx);
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

  /**
   * This thing runs every now and then and checks for new activities
   */
  private async periodicCheck() {
    const now = moment();
    const nowMinues10 = now.subtract(10, 'days');
    const activities = await getActivitiesSince(nowMinues10);
    const activitiesToPost = [];

    console.log(`Found ${activities.length} since ${nowMinues10.valueOf()}`);

    // We now have the activities for the last ten days. Which ones
    // did we already post?
    for (const activity of activities) {
      const alreadyPosted = await database.hasActivity({ id: activity.id });
      console.log(`Acitivty ${activity.id} known: ${!!alreadyPosted}`);

      if (!alreadyPosted) {
        activitiesToPost.push(activity);
      }
    }

    if (activitiesToPost.length > 0) {
      await this.postToChannel(this.formatActivities(activities));
      await database.addActivities(activitiesToPost.map((a) => ({ id: a.id })));
    }

    this.addToLastCheckedLog(now, activitiesToPost.length);
    this.lastChecked = now;
  }

  /**
   * Handles incoming Slack webhook requests for "debug"
   *
   * @param {Router.IRouterContext} ctx
   * @param {() => Promise<any>} next
   */
  private async handleDebugRequest(ctx: Router.IRouterContext) {
    let text: string = multiline.stripIndent(() => {
      /*
        *:hammer_and_wrench: Debug Information*

        _Process Information_
        Up since $UPTIME | Node: $NODE_VERSION

        _Last 50 Checks_
        $LASTCHECKS
      */
    });

    const uptime = moment.duration(process.uptime() * -1, 'seconds').humanize(true);
    const lastChecks = this.checkLog
      .map((v, i) => {
        // Even number, is timestamp
        if (i % 2 === 0) {
          return `\n${moment(v).format('MM/DD HH:mm')} (\`${v}\`) -`;
        } else {
          return ` ${v} activities found.`;
        }
      }).join('');

    text = text.replace('$UPTIME', uptime);
    text = text.replace('$NODE_VERSION', `${process.version}`);
    text = text.replace('$LASTCHECKS', lastChecks);

    ctx.body = {
      response_type: 'ephemeral',
      text
    };
  }

  /**
   * Handles incoming Slack webhook requests for "update"
   *
   * @param {Router.IRouterContext} ctx
   * @param {() => Promise<any>} next
   */
  private async handleUpdateRequest(ctx: Router.IRouterContext, text: string) {
    const updateSince = /update last checked (.*)$/i;

    if (updateSince.test(text)) {
      const sinceMatch = text.match(updateSince);
      const since = sinceMatch && sinceMatch.length > 1 ? sinceMatch[1] : undefined;
      const momentSince = moment(since);

      if (momentSince && momentSince.isValid()) {
        this.lastChecked = moment();
        this.periodicCheck();

        ctx.body = {
          response_type: 'ephemeral',
          text: `:ok_hand: Finding activities since ${momentSince.fromNow()}`
        };

        return;
      }
    }

    // Welp, let's post help
    return postDidNotWork(ctx);
  }

  /**
   * Handles incoming Slack webhook requests for "recent"
   *
   * @param {Router.IRouterContext} ctx
   * @param {() => Promise<any>} next
   */
  private async handleRecentRequest(ctx: Router.IRouterContext, text: string) {
    const isRecentCheck = isRecent(text);
    if (isRecentCheck.isRecent) {
      return this.postRecentActivities(ctx, isRecentCheck.count);
    }

    const isRecentSinceCheck = isRecentSince(text);
    if (isRecentSinceCheck.isRecentSince) {
      return this.postActivitiesSince(ctx, isRecentSinceCheck.since);
    }

    // Welp, let's post help
    return postDidNotWork(ctx);
  }

  /**
   * Posts recent activities in response to a Slack WebHook request
   *
   * @param {Router.IRouterContext} ctx
   * @param {number} [count]
   */
  private async postActivitiesSince(ctx: Router.IRouterContext, since: moment.Moment) {
    const activities = await getActivitiesSince(since);
    const text = `:sports_medal: *The last activities since ${since.fromNow()}:*`
    const attachments = this.formatActivities(activities).slice(0, 25);

    ctx.body = {
      text,
      response_type: 'in_channel',
      attachments
    };
  }

  /**
   * Posts recent activities in response to a Slack WebHook request
   *
   * @param {Router.IRouterContext} ctx
   * @param {number} [count]
   */
  private async postRecentActivities(ctx: Router.IRouterContext, count?: number) {
    const activities = await getActivities(50);
    const text = `:sports_medal: *The last ${count} activities:*`
    const attachments = this.formatActivities(activities).slice(0, count);

    ctx.body = {
      text,
      response_type: 'in_channel',
      attachments
    };
  }

  /**
   * Format a Strava activity
   *
   * @param {Array<StravaActivity>} input
   * @returns {Array<SlackMessageAttachment>}
   */
  private formatActivities(input: Array<StravaActivity>): Array<SlackMessageAttachment> {
    return input.map((a) => {
      const emoji = SPORTS_EMOJI[a.type] || a.type;
      const distance = metersToMiles(a.distance);
      const time = secondsToMinutes(a.moving_time);
      const pace = metersPerSecondToPaceString(a.average_speed);
      const achievements = a.achievement_count > 0
        ? `:trophy: ${a.achievement_count} achievements!`
        : '';

      return {
        fallback: '',
        author_name: `${a.athlete.firstname} ${a.athlete.lastname}`,
        author_link: `https://www.strava.com/athletes/${a.athlete.username}`,
        author_icon: a.athlete.profile,
        title: `${emoji} ${distance} miles at a ${pace} pace. ${achievements}`,
        title_link: `https://www.strava.com/activities/${a.id}`
      };
    });
  }

  /**
   * Post a message to a webhook
   *
   * @param {Array<SlackMessageAttachment>} attachments
   */
  private async postToChannel(attachments: Array<SlackMessageAttachment>) {
    const json = { attachments };

    if (!SLACK_WEBHOOK) {
      console.warn(`No Slack webhook configured, not posting`);
      return;
    }

    try {
      await request.post(SLACK_WEBHOOK, { json });
    } catch (error) {
      console.log(error);
    }
  }
}

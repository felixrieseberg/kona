import * as Router from 'koa-router';
import * as request from 'request-promise-native';
import * as moment from 'moment';

import { SLACK_WEBHOOK } from './config';
import { SlashCmdBody, SlackMessageAttachment, StravaActivity } from './interfaces';
import { Strava } from './strava';
import { metersToMiles, secondsToMinutes, metersPerSecondToMilesPace, metersPerSecondToPaceString } from './math';
import { isHelpRequest, postHelp, postDidNotWork } from './help';

interface StringMap<T> {
  [x: string]: T;
}

export class Slack {
  private slackClient: any;
  private stravaClient: Strava;
  private lastChecked = Date.now();

  constructor() {
    this.stravaClient = new Strava();
    this.handleSlackIncoming = this.handleSlackIncoming.bind(this);
    this.periodicCheck = this.periodicCheck.bind(this);

    // Setup periodic check (every 30m)
    this.periodicCheck();
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

    if (text.trim().includes('recent')) {
      return this.handleRecentRequest(ctx, text.trim());
    }

    if (text.trim().includes('update last checked')) {
      return this.handleUpdateRequest(ctx, text.trim());
    }

    return postDidNotWork(ctx);
  }

  /**
   * This thing runs every now and then and checks for new activities
   */
  private async periodicCheck() {
    const activities = await this.stravaClient.getActivitiesSince(this.lastChecked);
    console.log(`Found ${activities.length} since we last checked (which was ${this.lastChecked})`);

    if (activities && activities.length > 0) {
      this.postToChannel(this.formatActivities(activities));
    }

    this.lastChecked = Date.now();
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
        this.lastChecked = momentSince.toDate().getTime();
        this.periodicCheck();

        ctx.body = {
          response_type: 'ephemeral',
          text: `:ok_hand: Finding activities since ${momentSince.fromNow()}`
        };
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
    const simpleRecent = /recent (\d*)$/i;
    const recentSince = /recent since (.*)$/i;

    if (simpleRecent.test(text)) {
      const countMatch = text.match(simpleRecent);
      const count = countMatch && countMatch.length > 1 ? parseInt(countMatch[1], 10) : 10;
      return this.postRecentActivities(ctx, count);
    }

    if (recentSince.test(text)) {
      const sinceMatch = text.match(recentSince);
      const since = sinceMatch && sinceMatch.length > 1 ? sinceMatch[1] : undefined;
      const momentSince = moment(since);

      if (momentSince && momentSince.isValid()) {
        return this.postActivitiesSince(ctx, momentSince);
      }
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
  private async postActivitiesSince(ctx: Router.IRouterContext, ts: moment.Moment) {
    const activities = await this.stravaClient.getActivitiesSince(ts.toDate().getTime());
    const text = `:sports_medal: *The last activities since ${ts.fromNow()}:*`
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
    const activities = await this.stravaClient.getActivities(50);
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
      const emoji = this.stravaClient.emoji[a.type] || a.type;
      const distance = metersToMiles(a.distance);
      const time = secondsToMinutes(a.moving_time);
      const pace = metersPerSecondToPaceString(a.average_speed);
      const achievements = a.achievement_count > 0
        ? `:trophy: ${a.achievement_count} achievements!`
        : `Not a single achievement :disapproval:.`;

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

    try {
      await request.post(SLACK_WEBHOOK!, { json });
    } catch (error) {
      console.log(error);
    }
  }
}

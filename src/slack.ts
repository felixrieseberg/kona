import * as Router from 'koa-router';
import * as request from 'request-promise-native';
import { WebClient } from '@slack/client';

import { SLACK_WEBHOOK, SLACK_TOKEN, SLACK_NAME, SLACK_ICON } from './config';
import { SlashCmdBody, SlackMessageAttachment } from './interfaces';
import { Strava } from './strava';
import { metersToMiles, secondsToMinutes, metersPerSecondToMilesPace, metersPerSecondToPaceString } from './math';
import { isHelpRequest, postHelp } from './help';

interface StringMap<T> {
  [x: string]: T;
}

export class Slack {
  private slackClient: any;
  private stravaClient: Strava;

  constructor() {
    this.slackClient = new WebClient(SLACK_TOKEN);
    this.stravaClient = new Strava();
    this.handleSlackIncoming = this.handleSlackIncoming.bind(this);
  }

  public async handleSlackIncoming(ctx: Router.IRouterContext, next: () => Promise<any>) {
    const { response_url, token } = (ctx.request.body || {}) as SlashCmdBody;
    const { text } = ctx.request.body as SlashCmdBody;

    if (isHelpRequest(text)) {
      return await postHelp(ctx);
    }

    if (text.trim().includes('recent')) {
      const countMatch = text.trim().match(/recent (\d*)/i);
      const count = countMatch && countMatch.length > 1 ? parseInt(countMatch[0], 10) : 10;

      console.log(count);

      return await this.postRecentActivities(ctx, count);
    }
  }

  public async postRecentActivities(ctx: Router.IRouterContext, count?: number) {
    const activities = await this.stravaClient.getActivities(50);
    const text = `:sports_medal: *The last ${count} activities:*`
    const attachments: Array<SlackMessageAttachment> = activities.map((a) => {
      const emoji = this.stravaClient.emoji[a.type];
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
        title: `${emoji} ${distance} miles at ${pace} pace. ${achievements}`,
        title_link: `https://www.strava.com/activities/${a.id}`
      };
    }).slice(0, count);

    ctx.body = {
      text,
      response_type: 'in_channel',
      attachments
    };
  }

  public async postToChannel(text: string, author?: string) {
    console.log(`Posting to Slack:`, { text, author });

    const json = {
      username: SLACK_NAME,
      icon_url: SLACK_ICON,
      text: '',
    };

    await request.post(SLACK_WEBHOOK, { json });
  }
}

import * as Router from 'koa-router';
import * as request from 'request-promise-native';

import { BB_SLACK_CLIENT_ID, BB_SLACK_CLIENT_SECRET } from './config';
import { SlackOAuthResponse } from './interfaces';
import { database } from './database';

export async function authorizeSlack(ctx: Router.IRouterContext, next: () => Promise<any>) {
  const data = {
    form: {
      client_id: BB_SLACK_CLIENT_ID,
      client_secret: BB_SLACK_CLIENT_SECRET,
      code: ctx.query.code
    }
  };

  try {
    const response = await request.post('https://slack.com/api/oauth.access', data);
    const parsed: SlackOAuthResponse = JSON.parse(response);

    console.log(`Received OAuth response from Slack. OK: ${!!parsed.ok}`);

    if (parsed && parsed.ok) {
      database.addInstallation({
        slack: {
          accessToken: parsed.access_token,
          teamId: parsed.team_id,
          teamName: parsed.team_name,
          userId: parsed.user_id,
          incomingWebhook: {
            channel: parsed.incoming_webhook.channel,
            channelId: parsed.incoming_webhook.channel_id,
            configurationUrl: parsed.incoming_webhook.configuration_url,
            url: parsed.incoming_webhook.url
          }
        },
        strava: {
          clubs: []
        }
      }).catch((error) => console.log(`Tried to add installation in response to Slack OAuth, but failed`, error));
    }
  } catch (error) {
    console.warn(`Slack OAuth failed`, error);
  }

  ctx.body = 'Thanks';
}

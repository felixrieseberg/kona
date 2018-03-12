import * as Router from 'koa-router';
import * as request from 'request-promise-native';

import { BB_SLACK_CLIENT_ID, BB_SLACK_CLIENT_SECRET } from './config';
import { SlackOAuthInstallationResponse, SlackOAuthResponse } from './interfaces';
import { database } from './database';
import { assignCookiesAndState } from './utils/auth';

export function getOptionsFromSlackData(data: SlackOAuthInstallationResponse) {
  return {
    slack: {
      accessToken: data.access_token,
      teamId: data.team_id,
      teamName: data.team_name,
      userId: data.user_id,
      incomingWebhook: {
        channel: data.incoming_webhook.channel,
        channelId: data.incoming_webhook.channel_id,
        configurationUrl: data.incoming_webhook.configuration_url,
        url: data.incoming_webhook.url
      }
    },
    strava: {
      clubs: []
    }
  };
}

export async function authorizeSlack(ctx: Router.IRouterContext, next: () => Promise<any>) {
  const isSignIn = ctx.query.state === 'signin';
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
      assignCookiesAndState(ctx, parsed);

      // Only add this anstallation to the database if it's actually
      // an installation
      if (!isSignIn) {
        try {
          await database.addInstallation(getOptionsFromSlackData(parsed as SlackOAuthInstallationResponse));
        } catch (error) {
          console.log(`Tried to add installation in response to Slack OAuth, but failed`, error);
        }
      }
    }
  } catch (error) {
    console.warn(`Slack OAuth failed`, error);
  }

  return ctx.redirect('/');
}

import * as Router from 'koa-router';
import * as request from 'request-promise-native';

import { BB_SLACK_CLIENT_ID, BB_SLACK_CLIENT_SECRET, BB_STRAVA_CLIENT_ID, BB_STRAVA_CLIENT_SECRET } from './config';
import { SlackOAuthInstallationResponse, SlackOAuthResponse, StravaOAuthResponse, Installation } from './interfaces';
import { database } from './database';
import { assignCookiesAndStateSlack, assignCookiesAndStateStrava } from './utils/auth';
import { logger } from './logger';

const lp = `:lock: OAuth:`;

/**
 * Clean data from Slack up and return an object that we want to work with
 *
 * @param {SlackOAuthInstallationResponse} data
 */
export function getOptionsFromSlackData(data: SlackOAuthInstallationResponse): Installation {
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

/**
 * 3-Legged OAuth flow for Slack: The user clicked the button and was redirected back
 * to Kona by Slack. We're handling that redirect.
 *
 * @param {Router.IRouterContext} ctx
 * @param {() => Promise<any>} next
 */
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

    logger.log(`${lp} Received OAuth response from Slack. OK: ${!!parsed.ok}`);

    if (parsed && parsed.ok) {
      assignCookiesAndStateSlack(ctx, parsed);

      // Only add this anstallation to the database if it's actually
      // an installation
      if (!isSignIn) {
        try {
          await database.addInstallation(getOptionsFromSlackData(parsed as SlackOAuthInstallationResponse));
        } catch (error) {
          logger.log(`${lp} Tried to add installation in response to Slack OAuth, but failed`, error);
        }
      }
    } else {
      console.error(`${lp} Slack returned an OAuth error`, parsed);
    }
  } catch (error) {
    console.warn(`${lp} Slack OAuth failed`, error);
  }

  return ctx.redirect('/');
}

/**
 * 3-Legged OAuth flow for Strava: The user clicked the button and was redirected back
 * to Kona by Strava. We're handling that redirect.
 *
 * @param {Router.IRouterContext} ctx
 * @param {() => Promise<any>} next
 */
export async function authorizeStrava(ctx: Router.IRouterContext, next: () => Promise<any>) {
  const data = {
    form: {
      client_id: BB_STRAVA_CLIENT_ID,
      client_secret: BB_STRAVA_CLIENT_SECRET,
      code: ctx.query.code
    }
  };

  try {
    const response = await request.post('https://www.strava.com/oauth/token', data);
    const parsed: StravaOAuthResponse = JSON.parse(response);

    logger.log(`${lp} Received OAuth response from Strava. OK: ${!!parsed.access_token}`);

    if (parsed && parsed.access_token) {
      logger.log(`${lp} Data seems valid.`, parsed.athlete);
      assignCookiesAndStateStrava(ctx, parsed);
    }
  } catch (error) {
    console.warn(`${lp} Strava OAuth failed`, error);
  }

  return ctx.redirect('/');
}

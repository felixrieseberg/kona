import * as Router from 'koa-router';
import * as moment from 'moment';

import { Installation } from '../interfaces';
import { database } from '../database';
import { isRecent, isRecentSince } from '../utils/parse-text';
import { postDidNotWork } from './help';
import { getActivitiesSince, getActivities } from '../strava';
import { formatActivities } from '../utils/format-activities';

const strings = {
  noClubs: () => `We're not watching any clubs yet!`,
  failedGeneric: () => 'We failed to get information about your installation',
  failedDb: (op: string) => `We tried to ${op} the club, but encountered an internal database error :sadness:`
};

/**
 * Posts recent activities in response to a Slack WebHook request
 *
 * @param {Router.IRouterContext} ctx
 * @param {number} [count]
 */
async function postActivitiesSince(ctx: Router.IRouterContext, { strava }: Installation, since: moment.Moment) {
  const activities = await getActivitiesSince(since, strava.clubs);
  const text = `:sports_medal: *The last activities since ${since.fromNow()}:*`;
  const attachments = formatActivities(activities).slice(0, 25);

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
async function postRecentActivities(ctx: Router.IRouterContext, { strava }: Installation, count?: number) {
  const activities = await getActivities(strava.clubs, 50);
  const text = `:sports_medal: *The last ${count} activities:*`;
  const attachments = formatActivities(activities).slice(0, count);

  ctx.body = {
    text,
    response_type: 'in_channel',
    attachments
  };
}

/**
 * Handles incoming Slack webhook requests for "recent"
 *
 * @param {Router.IRouterContext} ctx
 * @param {() => Promise<any>} next
 */
export async function handleRecentRequest(ctx: Router.IRouterContext, text: string) {
  try {
    const { team_id } = ctx.request.body;
    const installation = await database.getInstallationForTeam(team_id);

    if (!installation) throw new Error(`No installation found`);
    if (!installation.strava.clubs || installation.strava.clubs.length < 1) {
      ctx.body = { text: strings.noClubs(), response_type: 'ephemeral' };
      return;
    }

    const isRecentCheck = isRecent(text);
    if (isRecentCheck.isRecent) {
      return postRecentActivities(ctx, installation, isRecentCheck.count);
    }

    const isRecentSinceCheck = isRecentSince(text);
    if (isRecentSinceCheck.isRecentSince) {
      return postActivitiesSince(ctx, installation, isRecentSinceCheck.since);
    }

    // Welp, let's post help
    return postDidNotWork(ctx);
  } catch (error) {
    logger.log(`Tried to get installation, but failed`, error);
    ctx.body = { text: strings.failedGeneric(), response_type: 'ephemeral' };
  }
}

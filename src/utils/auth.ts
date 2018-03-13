import * as Router from 'koa-router';
import { SlackOAuthResponse, SlackOAuthInstallationResponse, StravaOAuthResponse } from '../interfaces';
import { logger } from '../logger';

const lp = `:lock: ${lp}`;

export interface IsSignedIn {
  isSignedIn: boolean;
  userId: string;
  teamId: string;
}

export interface StravaState {
  accessToken: string;
  firstName: string;
  id: number;
}

/**
 * Is the session signed in?
 *
 * @param {Router.IRouterContext} ctx
 * @returns {IsSignedIn}
 */
export function getIsSignedIn(ctx: Router.IRouterContext): IsSignedIn {
  const teamId = ctx.cookies.get('s.teamId') || ctx.state.slackTeamId;
  const userId = ctx.cookies.get('s.userId') || ctx.state.slackUserId;
  const isSignedIn = !!(teamId && userId);

  logger.log(`${lp} Checking if user is signed into Slack (${userId ? userId : 'No'})`);

  ctx.state.slackTeamId = teamId;
  ctx.state.slackUserId = userId;
  ctx.state.isSignedIn = isSignedIn;

  return { isSignedIn, userId, teamId };
}

/**
 * Typecheck for Slack's response
 *
 * @export
 * @param {SlackOAuthResponse} r
 * @returns {r is SlackOAuthInstallationResponse}
 */
export function isInstallationResponse(r: SlackOAuthResponse): r is SlackOAuthInstallationResponse {
  return !!(r as SlackOAuthInstallationResponse).incoming_webhook;
}

/**
 * Assigns cookies and state for Slack's authentication state
 *
 * @param {Router.IRouterContext} ctx
 * @param {SlackOAuthResponse} r
 */
export function assignCookiesAndStateSlack(ctx: Router.IRouterContext, r: SlackOAuthResponse) {
  const userId = isInstallationResponse(r) ? r.user_id : r.user.id;
  const teamId = isInstallationResponse(r) ? r.team_id : r.team.id;

  ctx.cookies.set('s.teamId', teamId);
  ctx.cookies.set('s.userId', userId);
  ctx.state.slackUserId = userId;
  ctx.state.slackTeamId = teamId;
  ctx.state.isSignedIn = true;
}

/**
 * Is the session signed in?
 *
 * @param {Router.IRouterContext} ctx
 * @returns {IsSignedIn}
 */
export function getStravaStatus(ctx: Router.IRouterContext): StravaState | null {
  const idCookie = ctx.cookies.get('st.athleteId');
  const id = ctx.state.stravaAthleteId || idCookie ? parseInt(idCookie, 10) : undefined;
  const accessToken = ctx.state.stravaAccessToken || ctx.cookies.get('st.accessToken');
  const firstName = ctx.state.stravaFirstName || ctx.cookies.get('st.firstName');

  logger.log(`${lp} Checking if user is signed into Strava (${firstName ? firstName : 'No'})`);

  ctx.state.stravaAccessToken = accessToken;
  ctx.state.stravaAthleteId = id;
  ctx.state.stravaFirstName = firstName;

  return !!(accessToken && id && firstName)
    ? { accessToken, id, firstName }
    : null;
}

/**
 * Assigns cookies and state for Strava's authentication state
 *
 * @param {Router.IRouterContext} ctx
 * @param {SlackOAuthResponse} r
 */
export function assignCookiesAndStateStrava(ctx: Router.IRouterContext, r: StravaOAuthResponse) {
  const athleteId = r.athlete.id;
  const accessToken = r.access_token;
  const firstName = r.athlete.firstname;

  ctx.cookies.set('st.firstName', firstName);
  ctx.cookies.set('st.accessToken', accessToken);
  ctx.cookies.set('st.athleteId', athleteId.toString());
  ctx.state.stravaAccessToken = accessToken;
  ctx.state.stravaAthleteId = athleteId;
  ctx.state.stravaFirstName = firstName;
  ctx.state.isStravaConnected = true;
}

/**
 * Signs the user out
 *
 * @export
 * @param {Router.IRouterContext} ctx
 * @returns
 */
export function signOut(ctx: Router.IRouterContext) {
  // Slack
  ctx.cookies.set('s.teamId', undefined);
  ctx.cookies.set('s.userId', undefined);
  ctx.state.slackUserId = undefined;
  ctx.state.slackTeamId = undefined;
  ctx.state.isSignedIn = false;

  // Strava
  ctx.cookies.set('st.accessToken', undefined);
  ctx.cookies.set('st.athleteId', undefined);
  ctx.cookies.set('st.firstName', undefined);
  ctx.state.stravaAccessToken = undefined;
  ctx.state.stravaAthleteId = undefined;
  ctx.state.stravaFirstName = undefined;
  ctx.state.isStravaConnected = false;

  return ctx.redirect('/');
}

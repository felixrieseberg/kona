import * as Router from 'koa-router';
import { SlackOAuthResponse, SlackOAuthInstallationResponse } from '../interfaces';

export interface IsSignedIn {
  isSignedIn: boolean;
  userId: string;
  teamId: string;
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

  console.log(teamId, userId, isSignedIn);

  ctx.state.slackTeamId = teamId;
  ctx.state.slackUserId = userId;
  ctx.state.isSignedIn = isSignedIn;

  return { isSignedIn, userId, teamId };
}

export function isInstallationResponse(r: SlackOAuthResponse): r is SlackOAuthInstallationResponse {
  return !!(r as SlackOAuthInstallationResponse).incoming_webhook;
}

/**
 * Assigns cookies and state for the authentication state
 *
 * @param {Router.IRouterContext} ctx
 * @param {SlackOAuthResponse} r
 */
export function assignCookiesAndState(ctx: Router.IRouterContext, r: SlackOAuthResponse) {
  const userId = isInstallationResponse(r) ? r.user_id : r.user.id;
  const teamId = isInstallationResponse(r) ? r.team_id : r.team.id;

  ctx.cookies.set('s.teamId', teamId);
  ctx.cookies.set('s.userId', userId);
  ctx.state.slackUserId = userId;
  ctx.state.slackTeamId = teamId;
  ctx.state.isSignedIn = true;
}

/**
 * Signs the user out
 *
 * @export
 * @param {Router.IRouterContext} ctx
 * @returns
 */
export function signOut(ctx: Router.IRouterContext) {
  ctx.cookies.set('s.teamId', undefined);
  ctx.cookies.set('s.userId', undefined);
  ctx.state.slackUserId = undefined;
  ctx.state.slackTeamId = undefined;
  ctx.state.isSignedIn = false;

  return ctx.redirect('/');
}

import * as Router from 'koa-router';

import { getIsSignedIn } from '../utils/auth';
import { database } from '../database';
import { renderHome, renderInstall, renderConfigure } from './index';

export async function renderRoot(ctx: Router.IRouterContext) {
  const { isSignedIn, teamId } = getIsSignedIn(ctx);
  ctx.state.active = { root: true };

  if (isSignedIn) {
    const installation = await database.getInstallationForTeam(teamId);
    if (installation) {
      return renderConfigure(ctx, installation);
    }

    return renderInstall(ctx);
  }

  return renderHome(ctx);
}

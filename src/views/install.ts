import * as Router from 'koa-router';
import { logger } from '../logger';

const lp = `:frame_with_picture: *View (Install)*:`;

export async function renderInstall(ctx: Router.IRouterContext) {
  ctx.state.page = 'install';
  ctx.state.active = { install: true };

  logger.log(`${lp} Rendering view`);

  return ctx.render('./install.hbs');
}

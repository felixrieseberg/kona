import * as Router from 'koa-router';
import { logger } from '../logger';

const lp = `:frame_with_picture: *View (More)*:`;

export async function renderMore(ctx: Router.IRouterContext) {
  ctx.state.page = 'more';
  ctx.state.active = { more: true };

  logger.log(`${lp} Rendering view`);

  return ctx.render('./more.hbs');
}

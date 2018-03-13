import * as Router from 'koa-router';

export async function renderMore(ctx: Router.IRouterContext) {
  ctx.state.page = 'more';
  ctx.state.active = { more: true };

  return ctx.render('./more.hbs');
}
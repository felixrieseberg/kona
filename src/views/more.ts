import * as Router from 'koa-router';

export async function renderMore(ctx: Router.IRouterContext) {
  ctx.state.page = 'more';

  return ctx.render('./more.hbs');
}
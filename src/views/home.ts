import * as Router from 'koa-router';

export async function renderHome(ctx: Router.IRouterContext) {
  ctx.state.page = 'home';
  return ctx.render('./index.hbs');
}

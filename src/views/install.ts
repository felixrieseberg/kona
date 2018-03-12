import * as Router from 'koa-router';

export async function renderInstall(ctx: Router.IRouterContext) {
  ctx.state.page = 'install';
  return ctx.render('./install.hbs');
}

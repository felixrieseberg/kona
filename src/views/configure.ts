import * as Router from 'koa-router';
import { Installation } from '../interfaces';
import { getClubs } from '../strava';

export async function renderConfigure(ctx: Router.IRouterContext, install: Installation) {
  ctx.state.page = 'configure';

  try {
    ctx.state.clubs = await getClubs(install.strava.clubs);
  } catch (error) {
    // Todo
  }

  return ctx.render('./configure.hbs');
}

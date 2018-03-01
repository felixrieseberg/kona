import * as Koa from 'koa';
import * as logger from 'koa-logger';
import * as mount from 'koa-mount';
import * as Router from 'koa-router';
import * as bodyparser from 'koa-bodyparser';
import * as serve from 'koa-static';
import * as koaJson from 'koa-json';
import { Slack } from './slack';
import { getActivities } from './strava';

const app = new Koa();
const router = new Router();
const slack = new Slack();

app.use(bodyparser());
app.use(koaJson());

if (process.env.LOG_DESKTOP_HTTP || true) app.use(logger());

router.get('/', async (ctx: Router.IRouterContext, next: () => Promise<any>) => {
  ctx.body = 'Hi 🙋';
});

router.get('/activities', async (ctx: Router.IRouterContext, next: () => Promise<any>) => {
  ctx.body = await getActivities(20);
});

router.post('/webhook', slack.handleSlackIncoming);

app.use(router.routes() as any);
app.use(serve('static'));

app.listen(process.env.PORT || 8082, () => {
  console.log(`Blobbot is now live on ${process.env.PORT || 8082}`);
});

import * as Koa from 'koa';
import * as logger from 'koa-logger';
import * as Router from 'koa-router';
import * as bodyparser from 'koa-bodyparser';
import * as serve from 'koa-static';
import * as koaJson from 'koa-json';

import { Slack } from './slack';
import { authorizeSlack } from './oauth';
import { getInstallations } from './commands/debug';

const app = new Koa();
const router = new Router();
const slack = new Slack();

app.use(bodyparser());
app.use(koaJson());
app.use(logger());

router.get('/debug/installations', getInstallations);

router.get('/oauth/slack', authorizeSlack);

router.post('/webhook', slack.handleSlackIncoming);

app.use(router.routes() as any);
app.use(serve('static'));

app.listen(process.env.PORT || 8082, () => {
  console.log(`Blobbot is now live on ${process.env.PORT || 8082}`);
});

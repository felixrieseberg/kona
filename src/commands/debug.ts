import * as Router from 'koa-router';
import * as moment from 'moment';
import * as multiline from 'multiline';

import { database } from '../database';
import { logger } from '../logger';

const lp = `:wrench: *Command (Debug)*:`;

export async function handleDebugRequest(ctx: Router.IRouterContext, checkLog: Array<number>) {
  const { team_id } = ctx.request.body;
  logger.log(`${lp} Handling "debug" request for team ${team_id}.`);

  let text: string = multiline.stripIndent(() => {
    /*
      *:hammer_and_wrench: Debug Information*

      _Process Information_
      Up since $UPTIME | Node: $NODE_VERSION

      _Last 50 Checks_
      $LASTCHECKS

      _Database_
      $CONNECTION
    */
  });

  const uptime = moment.duration(process.uptime() * -1, 'seconds').humanize(true);
  const lastChecks = checkLog
    .map((v, i) => {
      // Even number, is timestamp
      if (i % 2 === 0) {
        return `\n${moment(v).format('MM/DD HH:mm')} (\`${v}\`) -`;
      } else {
        return ` ${v} activities found.`;
      }
    }).join('');

  text = text.replace('$UPTIME', uptime);
  text = text.replace('$NODE_VERSION', `${process.version}`);
  text = text.replace('$LASTCHECKS', lastChecks);
  text = text.replace('$CONNECTION', `Connected: ${database.isConnected()}`);

  ctx.body = { response_type: 'ephemeral', text };
}

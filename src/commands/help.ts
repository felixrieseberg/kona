import * as multiline from 'multiline';
import * as Koa from 'koa';
import { BB_SLACK_SLASH_COMMAND } from '../config';

const help = (multiline.stripIndent(() => {
  /*
    Before Kona can do anything, you will need to tell Kona which Strava clubs to watch. Type `/kona clubs help` for assistance.

    *:family: Clubs*
    To add the Strava club 123456:
    > `/kona clubs add 123456`
    Add remove the  Strava club 123456:
    > `/kona clubs remove 123456`
    To see which Strava clubs are being watched by Kona:
    > `/kona clubs`

    *:runner: Recent activities*
    To just get the recent activities:
    > `/kona recent`
    To get the last 15 activities (max 50):
    > `/kona recent 15`
    To get activities since February 3rd 2018:
    > `/kona recent 2018-02-03`
    :point_up: If you're a date nerd, this will support all ISO 8601 formats.

    *:family: Members*
    To get members for our clubs:
    > `/kona members` or `/kona athletes`

    *:robot_face: Operations*
    To see this help output:
    > `/kona help`
  */
}) as string).replace(/\/kona/g, BB_SLACK_SLASH_COMMAND);

export async function postHelp(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: `:sports_medal: It seems like you asked for help :ambulance:. Here's how to do things:\n\n${help}`,
  };
}

export async function postDidNotWork(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: ':sadness: Hm, that did not work. Type `/blob help` for help.'
  };
}

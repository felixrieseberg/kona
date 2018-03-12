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

// tslint:disable:max-line-length
const clubHelp = (multiline.stripIndent(() => {
  /*
    Before Kona can do anything, you will need to tell Kona which Strava clubs to watch.

    Due to limitations in the Strava API, Kona needs to know the clubs `id`. If you already know your clubs `id`, simply enter `/kona clubs add` followed by the clubs `id` number. If you don't know, read on for a short tutorial.

    - Head over to https://www.strava.com/clubs to see your Strava clubs.
    - Click on a club of your choice, taking you to the club's Strava dashboard.
    - Click on any of the club's links, like "Club Leaderboard", "Recent Activity", or "Members".
    - Your browser's url should now be `https://www.strava.com/clubs/` followed by a number. That's your club's `id`. If your url is `https://www.strava.com/clubs/336978/recent_activity`, your club's `id` is 336978.
    - In Slack, enter `/kona clubs add` followed by the clubs `id` number - for instance `/kona clubs add 336978`.
  */
}) as string).replace(/\/kona/g, BB_SLACK_SLASH_COMMAND);
// tslint:enable:max-line-length

export async function postHelp(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: `:sports_medal: It seems like you asked for help :ambulance:. Here's how to do things:\n\n${help}`,
  };
}

export async function postClubHelp(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: `:sports_medal: It seems like you asked for help :ambulance:. Here's how to do things:\n\n${clubHelp}`,
  };
}

export async function postDidNotWork(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: ':sadness: Hm, that did not work. Type `/blob help` for help.'
  };
}

export async function postNoClubs(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: `:no_good: We're not watching any clubs yet. Add one with \`${BB_SLACK_SLASH_COMMAND} clubs add\`!`,
  };
}
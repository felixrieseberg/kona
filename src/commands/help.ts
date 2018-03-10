import * as multiline from 'multiline';
import * as Koa from 'koa';
import { BB_SLACK_SLASH_COMMAND } from '../config';

const help = (multiline.stripIndent(() => {
  /*
    *:runner: Recent activities*
    To just get the recent activities:
    > `/blob recent`
    To get the last 15 activities (max 50):
    > `/blob recent 15`
    To get activities since February 3rd 2018:
    > `/blob recent 2018-02-03`
    :point_up: If you're a date nerd, this will support all ISO 8601 formats.

    *:family: Members*
    To get members for our clubs:
    > `/blob members` or `/blob athletes`

    *:robot_face: Operations*
    To check for new activities now:
    > `/blob check now`
    To see debug output:
    > `/blob debug`
    To see this help output:
    > `/blob help`
  */
}) as string).replace(/\/blob/g, BB_SLACK_SLASH_COMMAND);

export function isHelpRequest(text: string) {
  return !!(text.trim() === '' || /(help)|(🚑)|(👩‍🚒)|(🚨)|(👨‍🚒)|(🚒)|(\?)$/i.test(text.trim()));
}

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

export async function postNoClubs(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: `:no_good: We're not watching any clubs yet. Add one with \`${BB_SLACK_SLASH_COMMAND} clubs add\`!`,
  };
}
import * as multiline from 'multiline';
import * as Koa from 'koa';

const help = multiline.stripIndent(() => {
  /*
    *:runner: Recent activities*
    To just get the recent activities:
    > `/blob recent`
    To get the last 15 activities (max 50):
    > `/blob recent 15`
  */
});

export function isHelpRequest(text: string) {
  return !!(text.trim() === '' || /(help)|(🚑)|(👩‍🚒)|(🚨)|(👨‍🚒)|(🚒)|(\?)$/i.test(text.trim()));
}

export async function postHelp(ctx: Koa.Context) {
  ctx.body = {
    response_type: 'ephemeral',
    text: `:sports_medal: It seems like you asked for help :ambulance:. Here's how to do things:\n\n${help}`,
  };
}

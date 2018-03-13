import * as request from 'request-promise-native';
import * as Router from 'koa-router';

import { BB_LOGGER_WEBHOOK } from './config';
import { SlackMessage } from './interfaces';

const disableRegex = /.* disable log module (.*)/;
const enableRegex = /.* enable log module (.*)/;

const strings = {
  enabled: () => `Slack Logger enabled.`,
  disabled: () => `Slack Logger disabled.`,
  moduleEnabled: (t: string) => `Enabled module \`${t}\``,
  moduleDisabled: (t: string) => `Disabled module \`${t}\``,
};

/**
 * This logger class allows to abuse Slack as an actual log
 *
 * @class Logger
 */
export class Logger {
  public isSlackEnabled = true;
  public disableLogFilter: Array<string> = [];

  public silly(text: string, ...objects: Array<any>) {
    this.postToSlack(text, ...objects);
  }

  public log(text: string, ...objects: Array<any>) {
    console.log(text, ...objects);
    this.postToSlack(text, ...objects);
  }

  public error(text: string, ...objects: Array<any>) {
    console.error(text, ...objects);
    this.postToSlack(text, ...objects);
  }

  public warn(text: string, ...objects: Array<any>) {
    console.warn(text, ...objects);
    this.postToSlack(text, ...objects);
  }

  public handleEnableCommand(ctx: Router.IRouterContext) {
    this.isSlackEnabled = true;
    ctx.body = { text: strings.enabled() };
  }

  public handleDisableCommand(ctx: Router.IRouterContext) {
    this.isSlackEnabled = false;
    ctx.body = { text: strings.disabled() };
  }

  public handleDisableModuleCommand(ctx: Router.IRouterContext, text: string) {
    const match = text.match(disableRegex);
    if (match && match[1]) {
      this.disableLogFilter.push(match[1]);
      ctx.body = { text: strings.moduleDisabled(match[1]) };
    }
  }

  public handleEnableModuleCommand(ctx: Router.IRouterContext, text: string) {
    const match = text.match(enableRegex);
    if (match && match[1]) {
      this.disableLogFilter = this.disableLogFilter.filter((e) => e !== match[1]);
      ctx.body = { text: strings.moduleEnabled(match[1]) };
    }
  }

  private async postToSlack(text: string, ...objects: Array<any>) {
    // Should we post to Slack at all?
    if (!BB_LOGGER_WEBHOOK || !this.isSlackEnabled) {
      return;
    }

    // Is a filter active?
    if (this.disableLogFilter.find((v) => (text.toLowerCase()).includes(v.toLowerCase()))) {
      return;
    }

    const json: SlackMessage = {
      text,
      attachments: []
    };

    objects.forEach((obj) => {
      json!.attachments!.push({
        text: `\`\`\`\n${JSON.stringify(obj, null, 2)}\n\`\`\``
      });
    });

    try {
      await request.post(BB_LOGGER_WEBHOOK, { json });
    } catch (error) {
      console.log(error);
    }
  }
}

export const logger = new Logger();

import * as request from 'request-promise-native';

import { BB_LOGGER_WEBHOOK } from './config';
import { SlackMessage } from './interfaces';

export class Logger {
  public isSlackEnabled = false;

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

  private async postToSlack(text: string, ...objects: Array<any>) {
    if (!BB_LOGGER_WEBHOOK) {
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

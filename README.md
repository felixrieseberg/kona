# Blob Bot (A Strava Slack Bot)`
[![Build Status](https://travis-ci.org/felixrieseberg/blob-bot.svg?branch=master)](https://travis-ci.org/felixrieseberg/blob-bot)

This is a Slack Bot that automatically posts activities for a Strava Club into
a Slack channel. It also supports various commands allowing users to see
activities directly in Slack.

It uses Node.js and MongoDB.

![screenshot](https://user-images.githubusercontent.com/1426799/36899534-33e34942-1e28-11e8-93ab-809ab0b7cc38.png)

## Available Commands

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

## Installation & Configuration

The following environment variables need to be set for the app to work properly.
All these settings can also be configured in `src/config.ts`.

```
// Slack Webhook URL
// Example: 'https://hooks.slack.com/services/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'
BB_SLACK_WEBHOOK

// JSON Array of Strava Clubs to follow
// Example: '[{ "id": "336978" }]'
BB_STRAVA_CLUBS

// Strava Access Token
// Example: '9834bh234jh2hiu3jh23j4hsdfshjj2bh3bjh23a'
BB_STRAVA_TOKEN

// MongoDB Connection String
// Example: 'mongodb://blob:sdf@sdfsdf2.mlab.com:53958/blobbot'
BB_MONGO_STRING

// MongoDB Database Name
// Example: 'blobbot'
BB_MONGO_DB_NAME
```

#### Configuring the Strava Integration

Vist https://www.strava.com/settings/api and create a new API application.
Copy the "Access Token" and set it as the `BB_STRAVA_TOKEN` environment variable.

#### Configuring the Slack App

Visit https://api.slack.com/apps and click "Create a new app". This bot will
need two features: "Incoming Webhooks" and "Slash Commands".

Both features are optional, the bot can be used just as a slash command, or
just as tool that posts new activities to a Slack channel.

*Incoming Webhooks*: Add a new webhook to your app. Select a channel you want
the bot to post new activities in. Store the URL, you will need it later.

*Slash Commands*: Add a new slash command of your choice and give it the
endpoint `https://address-to-your-app.com/webhook`.

## License

MIT, see License for details.

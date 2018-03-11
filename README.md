# Kona, a Slack Bot for Strava`
[![Build Status](https://travis-ci.org/felixrieseberg/blob-bot.svg?branch=master)](https://travis-ci.org/felixrieseberg/blob-bot)

This is a Slack Bot that automatically posts activities for a Strava Club into
a Slack channel. It also supports various commands allowing users to see
activities directly in Slack.

It uses Node.js and MongoDB.

![screenshot](https://user-images.githubusercontent.com/1426799/36899534-33e34942-1e28-11e8-93ab-809ab0b7cc38.png)

## Available Commands

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
To check for new activities now:
> `/kona check now`
To see debug output:
> `/kona debug`
To see this help output:
> `/kona help`

## Installation & Configuration

The following environment variables need to be set for the app to work properly.
All these settings can also be configured in `src/config.ts`.

#### Configuring the Strava Integration

Vist https://www.strava.com/settings/api and create a new API application.
Copy the "Access Token" and set it as the `BB_STRAVA_TOKEN` environment variable.

## License

MIT, see License for details.

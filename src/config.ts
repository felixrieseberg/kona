export const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || '';
export const SLACK_TOKEN = process.env.SLACK_TOKEN || '';
export const SLACK_NAME = process.env.SLACK_NAME || '';
export const SLACK_ICON = process.env.SLACK_ICON || '';

export const STRAVA_CLUBS = process.env.STRAVA_CLUBS
  ? JSON.parse(process.env.STRAVA_CLUBS)
  : [{
    id: '336978'
  }]
export const STRAVA_TOKEN = process.env.STRAVA_TOKEN || '';

export const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;
export const STRAVA_CLUBS = process.env.STRAVA_CLUBS
  ? JSON.parse(process.env.STRAVA_CLUBS)
  : [{ id: '336978' }];
export const STRAVA_TOKEN = process.env.STRAVA_TOKEN;
export const MONGO_STRING = process.env.MONGO_STRING;
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

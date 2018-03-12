// Strava Access Token
// Example: '9834bh234jh2hiu3jh23j4hsdfshjj2bh3bjh23a'
export const BB_STRAVA_TOKEN = process.env.BB_STRAVA_TOKEN;

// MongoDB Connection String
// Example: 'mongodb://blob:sdf@sdfsdf2.mlab.com:53958/blobbot'
export const BB_MONGO_STRING = process.env.BB_MONGO_STRING;

// MongoDB Database Name
// Example: 'blobbot'
export const BB_MONGO_DB_NAME = process.env.BB_MONGO_DB_NAME;

// Optional configuration

// The interval at which the bot will check Strava for new activities, in minutes
export const BB_CHECK_INTERVAL = process.env.BB_CHECK_INTERVAL
  ? parseInt(process.env.BB_CHECK_INTERVAL, 10)
  : 15;

// Disable the regular check for new Strava activities alltogether
export const BB_DISABLE_CHECK = !!process.env.BB_DISABLE_CHECK;

// The name of the slash command.
// Example: '/blob'
export const BB_SLACK_SLASH_COMMAND = process.env.BB_SLACK_SLASH_COMMAND || '/kona';

// Slack's OAuth Client Id
export const BB_SLACK_CLIENT_ID = process.env.BB_SLACK_CLIENT_ID;

// Slack's OAuth Secret
export const BB_SLACK_CLIENT_SECRET = process.env.BB_SLACK_CLIENT_SECRET;

// Secret key for session storage
export const BB_SESSION_KEY = process.env.BB_SESSION_KEY || '';

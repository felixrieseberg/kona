// Slack Webhook URL
// Example: 'https://hooks.slack.com/services/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'
export const BB_SLACK_WEBHOOK = process.env.BB_SLACK_WEBHOOK;

// JSON Array of Strava Clubs to follow
// Example: '[{ "id": "336978" }]'
export const BB_STRAVA_CLUBS = process.env.BB_STRAVA_CLUBS
  ? JSON.parse(process.env.BB_STRAVA_CLUBS)
  : [{ id: '336978' }];

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

// The name of the slash command.
// Example: '/blob'
export const BB_SLACK_SLASH_COMMAND = process.env.BB_SLACK_SLASH_COMMAND || '/blob';

export interface StravaActivity {
  id: number;
  resource_state: number;
  external_id: string;
  upload_id: number;
  athlete: {
    id: number;
    username: string;
    resource_state: number;
    firstname: string;
    lastname: string;
    city: null;
    state: null;
    country: null;
    sex: string;
    premium: false;
    created_at: string;
    updated_at: string;
    badge_type_id: number;
    profile_medium: string;
    profile: string;
    friend: null;
    follower: null
  };
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: Activity;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: [ number, number ];
  end_latlng: [ number, number ];
  location_city: null;
  location_state: null;
  location_country: null;
  start_latitude: number;
  start_longitude: -122.26;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: false;
  commute: false;
  manual: false;
  private: false;
  flagged: false;
  gear_id: null;
  from_accepted_tag: false;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  has_heartrate: true;
  average_heartrate: number;
  max_heartrate: number;
  elev_high: number;
  elev_low: number;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: false;
  workout_type: number;
}

export interface StravaClubWithMembers {
  club: StravaClub;
  members: Array<StravaMember>;
}

export interface StravaMember {
  id: number;
  username: string;
  resource_state: number;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: string;
  premium: false;
  created_at: string;
  updated_at: string;
  badge_type_id: number;
  profile_medium: string;
  profile: string;
  friend: string;
  follower: string;
  membership: string;
  admin: boolean;
  owner: false;
}

export interface StravaClub {
  id: number;
  resource_state: number;
  name: string;
  profile_medium: string;
  profile: string;
  cover_photo: null;
  cover_photo_small: null;
  sport_type: string;
  city: string;
  state: string;
  country: string;
  private: true;
  member_count: number;
  featured: false;
  verified: false;
  url: string;
  membership: string;
  admin: true;
  owner: false;
  description: string;
  club_type: string;
  post_count: number;
  owner_id: number;
  following_count: number;
}

export interface SlashCmdBody {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
}

export interface SlackMessage {
  text?: string;
  username?: string;
  mrkdwn?: boolean;
  response_type?: string;
  attachments?: Array<SlackMessageAttachment>;
}

export interface SlackAuthor {
  author_name: string;
  author_icon: string;
  author_link: string;
}

export interface SlackMessageAttachmentField {
  title: string;
  value: string;
  short: boolean;
}

export interface SlackMessageAttachment {
  fallback?: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<SlackMessageAttachmentField>;
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface StringMap<T> {
  [x: string]: T;
}

export type SlackOAuthResponse = SlackOAuthInstallationResponse | SlackOAuthSigninResponse;

export interface SlackOAuthInstallationResponse {
  ok: boolean;
  access_token: string;
  scope: string;
  user_id: string;
  team_name: string;
  team_id: string;
  incoming_webhook: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
}

export interface SlackOAuthSigninResponse {
  ok: boolean;
  access_token: string;
  scope: string;
  user: {
    name: string;
    id: string;
  };
  team: {
    id: string;
    name: string;
    domain: string;
    image_34: string;
    image_44: string;
    image_68: string;
    image_88: string;
    image_102: string;
    image_132: string;
    image_230: string;
    image_original: string;
  };
}

export interface StravaOAuthResponse {
  access_token: string;
  token_type: string;
  athlete: {
    id: number;
    username: string;
    resource_state: number;
    firstname: string;
    lastname: string;
    city: string;
    state: string;
    country: string;
    sex: string;
    premium: false,
    created_at: string;
    updated_at: string;
    badge_type_id: number;
    profile_medium: string;
    profile: string;
    friend: string;
    follower: string;
    email: string;
  };
}

export interface Athelete {
  id: number;
  accessToken: string;
  firstName: string;
}

export interface InstallationActivity {
  ts: number;
  id: number;
}

export interface InstallationClub {
  token: string;
  id: number;
}

export interface Installation {
  _id?: string;
  installationTs: number;
  slack: {
    accessToken: string;
    userId: string;
    teamName: string;
    teamId: string;
    incomingWebhook: {
      channel: string;
      channelId: string;
      configurationUrl: string;
      url: string;
    }
  };
  strava: {
    knownActivities: Array<InstallationActivity>;
    clubs: Array<InstallationClub>;
  };
}

export enum Activity {
  AlpineSki = 'AlpineSki',
  BackcountrySki = 'BackcountrySki',
  Canoeing = 'Canoeing',
  Crossfit = 'Crossfit',
  EBikeRide = 'EBikeRide',
  Elliptical = 'Elliptical',
  Hike = 'Hike',
  IceSkate = 'IceSkate',
  InlineSkate = 'InlineSkate',
  Kayaking = 'Kayaking',
  Kitesurf = 'Kitesurf',
  NordicSki = 'NordicSki',
  Ride = 'Ride',
  RockClimbing = 'RockClimbing',
  RollerSki = 'RollerSki',
  Rowing = 'Rowing',
  Run = 'Run',
  Snowboard = 'Snowboard',
  Snowshoe = 'Snowshoe',
  StairStepper = 'StairStepper',
  StandUpPaddling = 'StandUpPaddling',
  Surfing = 'Surfing',
  Swim = 'Swim',
  VirtualRide = 'VirtualRide',
  Walk = 'Walk',
  WeightTraining = 'WeightTraining',
  Windsurf = 'Windsurf',
  Workout = 'Workout',
  Yoga = 'Yoga',
}

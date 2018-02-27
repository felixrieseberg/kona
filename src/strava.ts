import * as strava from 'strava-v3';
import { promisify } from 'util';

import { STRAVA_CLUBS, STRAVA_TOKEN } from './config';
import { StravaActivity, StringMap } from './interfaces';

const listActivities = promisify(strava.clubs.listActivities);

export class Strava {
  public emoji: StringMap<String> = {
    'Ride': ':bike:',
    'Run': ':runner:',
    'Swim': ':swimmer:',
  }

  public async getActivities(count: number = 10): Promise<Array<StravaActivity>> {
    const allActivities: Array<StravaActivity> = [];

    for (const club of STRAVA_CLUBS) {
      const { id } = club;
      const options = { access_token: STRAVA_TOKEN, per_page: count, id };

      try {
        const activities: Array<StravaActivity> = await listActivities(options);

        if (!activities || activities.length === 0) {
          console.log(`No activities found.`);
          continue;
        }

        console.log(`${activities.length} activities found`);
        allActivities.push(...activities);
      } catch (error) {
        console.error(`Failed to fetch activities`, error);
      }
    }

    return allActivities;
  }
}

import * as strava from 'strava-v3';
import { promisify } from 'util';
import * as moment from 'moment';

import { BB_STRAVA_TOKEN } from './config';
import { StravaActivity, StringMap, StravaClubWithMembers, StravaClub, StravaMember } from './interfaces';

const listMembers = promisify(strava.clubs.listMembers);
const listActivities = promisify(strava.clubs.listActivities);
const getClub = promisify(strava.clubs.get);

export const STRAVA_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:SSZ';

export const SPORTS_EMOJI: StringMap<string> = {
  Ride: ':bike:',
  Run: ':runner:',
  Swim: ':swimmer:',
  VirtualRide: ':computer::bike:',
  VirtualRun: ':computer::runner:',
  Walk: ':walking:'
};

/**
 * Get information about a bunch of clubs
 *
 * @param {Array<number>} clubIds
 * @returns {Promise<Array<StravaClub>>}
 */
export async function getClubs(clubIds: Array<number>): Promise<Array<StravaClub>> {
  const clubs = [];

  for (const id of clubIds) {
    const options = { access_token: BB_STRAVA_TOKEN, per_page: 100, id };

    try {
      clubs.push(await getClub(options));
    } catch (error) {
      console.error(`Failed to fetch club`, error);
    }
  }

  return clubs;
}

/**
 * Gets members and club information
 *
 * @returns {Promise<Array<StravaClubWithMembers>>}
 */
export async function getMembers(clubs: Array<number>): Promise<Array<StravaClubWithMembers>> {
  const clubsWithMembers = [];

  for (const id of clubs) {
    const options = { access_token: BB_STRAVA_TOKEN, per_page: 100, id };

    try {
      const club: StravaClub = await getClub(options);
      const members: Array<StravaMember> = await listMembers(options);

      if (members) {
        clubsWithMembers.push({ club, members });
      }
    } catch (error) {
      console.error(`Failed to fetch members`, error);
    }
  }

  return clubsWithMembers;
}

/**
 * Return activities since a certain moment
 *
 * @export
 * @param {moment.Moment} since
 * @returns {Promise<Array<StravaActivity>>}
 */
export async function getActivitiesSince(since: moment.Moment, clubs: Array<number>): Promise<Array<StravaActivity>>  {
  const activities = await getActivities(clubs, 10);
  const newActivities = activities.filter((a) => {
    return moment(a.start_date, STRAVA_TIME_FORMAT).isSameOrAfter(since);
  });

  return newActivities;
}

/**
 * Return activities
 *
 * @export
 * @param {number} [count=10]
 * @returns {Promise<Array<StravaActivity>>}
 */
export async function getActivities(clubs: Array<number>, count: number = 10): Promise<Array<StravaActivity>> {
  const allActivities: Array<StravaActivity> = [];

  for (const id of clubs) {
    const options = { access_token: BB_STRAVA_TOKEN, per_page: count, id };

    try {
      const activities: Array<StravaActivity> = await listActivities(options);

      if (!activities || activities.length === 0) {
        console.log(`${id}: No activities found.`);
        continue;
      }

      console.log(`${id}: ${activities.length} activities found`);
      allActivities.push(...activities);
    } catch (error) {
      console.error(`${id}: Failed to fetch activities`, error);
    }
  }

  return allActivities.slice(0, count);
}

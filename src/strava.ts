import * as strava from 'strava-v3';
import { promisify } from 'util';
import * as moment from 'moment';
import * as fs from 'fs';

import { BB_STRAVA_CLUBS, BB_STRAVA_TOKEN } from './config';
import { StravaActivity, StringMap, StravaClubWithMembers, StravaClub, StravaMember } from './interfaces';

const listActivities = promisify(strava.clubs.listActivities as Function);
const listMembers = promisify(strava.clubs.listMembers as Function);
const getClub = promisify(strava.clubs.get as Function);

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
 * Gets members and club information
 *
 * @returns {Promise<Array<StravaClubWithMembers>>}
 */
export async function getMembers(): Promise<Array<StravaClubWithMembers>> {
  const clubsWithMembers = [];

  for (const club of BB_STRAVA_CLUBS) {
    const { id } = club;
    const options = { access_token: BB_STRAVA_TOKEN, per_page: 100, id };

    try {
      const club: StravaClub = await getClub(options);
      const members: Array<StravaMember> = await listMembers(options);

      console.log(club);
      console.log(members);

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
export async function getActivitiesSince(since: moment.Moment): Promise<Array<StravaActivity>>  {
  const activities = await getActivities();
  const newActivities = activities.filter((a) => {
    // The date format we get from Strava is:
    // 2018-02-28T15:57:07Z
    // YYYY-MM-DDTHH:mm:SSZ
    const formattedDate = moment(a.start_date, STRAVA_TIME_FORMAT);
    return moment(a.start_date).isSameOrAfter(since);
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
export async function getActivities(count: number = 10): Promise<Array<StravaActivity>> {
  const allActivities: Array<StravaActivity> = [];

  for (const club of BB_STRAVA_CLUBS) {
    const { id } = club;
    const options = { access_token: BB_STRAVA_TOKEN, per_page: count, id };

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

  return allActivities.slice(0, count);
}

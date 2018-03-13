import * as strava from 'strava-v3';
import { promisify } from 'util';
import * as moment from 'moment';

import { StravaActivity, StringMap, StravaClubWithMembers, StravaClub, StravaMember, Athelete, InstallationClub } from './interfaces';
import { logger } from './logger';

const listMembers = promisify(strava.clubs.listMembers);
const listActivities = promisify(strava.clubs.listActivities);
const getClub = promisify(strava.clubs.get);
const getAthleteClubs = promisify(strava.athlete.listClubs);

const lp = `:bike: *Strava*:`;

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
 * List the clubs for a single athlete
 *
 * @param {Athelete} athelete
 * @returns {Promise<Array<StravaClub>>}
 */
export async function getClubsForAthelete(athelete: Athelete): Promise<Array<StravaClub>> {
  const clubs = [];

  logger.log(`${lp} Fetching clubs for athlete ${athelete.id} (${athelete.firstName})`);

  try {
    const options = { access_token: athelete.accessToken, per_page: 100 };
    const response = await getAthleteClubs(options) || [];

    clubs.push(...response);
  } catch (error) {
    console.error(`Failed to fetch clubs for athlete`, error);
  }

  logger.log(`${lp} Found ${clubs.length} clubs for athlete ${athelete.id} (${athelete.firstName})`);
  return clubs;
}

/**
 * Get information about a bunch of clubs
 *
 * @param {Array<number>} clubIds
 * @returns {Promise<Array<StravaClub>>}
 */
export async function getClubs(installationClubs: Array<InstallationClub>): Promise<Array<StravaClub>> {
  const clubs = [];

  logger.log(`${lp} Fetching details for ${installationClubs.length} clubs`);

  for (const { id, token } of installationClubs) {
    const options = { access_token: token, per_page: 100, id };

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
export async function getMembers(clubs: Array<InstallationClub>): Promise<Array<StravaClubWithMembers>> {
  const clubsWithMembers = [];

  for (const { id, token } of clubs) {
    const options = { access_token: token, per_page: 100, id };

    try {
      const club: StravaClub = await getClub(options);
      const members: Array<StravaMember> = await listMembers(options);

      if (members) {
        clubsWithMembers.push({ club, members });
      }
    } catch (error) {
      logger.error(`Failed to fetch members`, error);
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
export async function getActivitiesSince(since: moment.Moment, clubs: Array<InstallationClub>): Promise<Array<StravaActivity>>  {
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
export async function getActivities(clubs: Array<InstallationClub>, count: number = 10): Promise<Array<StravaActivity>> {
  const allActivities: Array<StravaActivity> = [];

  logger.log(`${lp} Getting up to ${count} activities for ${clubs.length} clubs`);

  for (const { id, token } of clubs) {
    const options = { access_token: token, per_page: count, id };

    try {
      const activities: Array<StravaActivity> = await listActivities(options);

      if (!activities || activities.length === 0) {
        logger.log(`${lp} Club ${id}: No activities found.`);
        continue;
      }

      logger.log(`${lp} Club ${id}: ${activities.length} activities found`);
      allActivities.push(...activities);
    } catch (error) {
      logger.error(`${id}: Failed to fetch activities`, error);
    }
  }

  return allActivities;
}

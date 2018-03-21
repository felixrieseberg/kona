import * as strava from 'strava-v3';
import { promisify } from 'util';
import * as moment from 'moment';
import * as LRU from 'lru-cache';

import {
  StravaActivity,
  StringMap,
  StravaClubWithMembers,
  StravaClub,
  StravaMember,
  Athlete,
  InstallationClub,
  InstallationActivity
} from './interfaces';
import { logger } from './logger';
import { getStravaTimestamp } from './utils/strava-ts';

const listMembers = promisify(strava.clubs.listMembers);
const listActivities = promisify(strava.clubs.listActivities);
const getClub: (options: any) => Promise<StravaClub> = promisify(strava.clubs.get);
const getAthleteClubs = promisify(strava.athlete.listClubs);

const lp = `:bike: *Strava*:`;
const cache = LRU({ maxAge: 1000 * 60 * 30, max: 1024 * 1000 * 100 });

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
 * Gets a club, but from the cache if available
 *
 * @param {InstallationClub} { id, token }
 * @returns {(Promise<StravaClub | null>)}
 */
export async function getClubWithCache({ id, token }: InstallationClub): Promise<StravaClub> {
  try {
    let clubDetails = cache.get(`club_${id}`) as StravaClub | undefined;

    if (!clubDetails) {
      const options = { access_token: token, per_page: 100, id };
      clubDetails = await getClub(options);
      cache.set(`club_${id}`, clubDetails);
    }

    return clubDetails;
  } catch (error) {
    logger.error(`${lp} Getting club details failed`, error);
    throw new Error(error);
  }
}

/**
 * List the clubs for a single athlete
 *
 * @param {Athlete} athlete
 * @returns {Promise<Array<StravaClub>>}
 */
export async function getClubsForAthlete(athlete: Athlete): Promise<Array<StravaClub>> {
  const clubs = [];

  logger.log(`${lp} Fetching clubs for athlete ${athlete.id} (${athlete.firstName})`);

  try {
    const options = { access_token: athlete.accessToken, per_page: 100 };
    const response = await getAthleteClubs(options) || [];

    clubs.push(...response);
  } catch (error) {
    console.error(`Failed to fetch clubs for athlete`, error);
  }

  logger.log(`${lp} Found ${clubs.length} clubs for athlete ${athlete.id} (${athlete.firstName})`);
  return clubs;
}

/**
 * Get information about a bunch of clubs
 *
 * @param {Array<number>} clubIds
 * @returns {Promise<Array<StravaClub>>}
 */
export async function getClubs(installationClubs: Array<InstallationClub>): Promise<Array<StravaClub>> {
  const clubs: Array<StravaClub> = [];

  logger.log(`${lp} Fetching details for ${installationClubs.length} clubs`);

  for (const installationClub of installationClubs) {
    try {
      clubs.push(await getClubWithCache(installationClub));
    } catch (error) {
      logger.error(`${lp} Failed to fetch club`, error);
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

  for (const iClub of clubs) {
    const options = { access_token: iClub.token, per_page: 100, id: iClub.id };

    try {
      const club: StravaClub = await getClubWithCache(iClub);
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
    // Strava can sometimes not send us a start date
    return !a.start_date || moment(a.start_date, STRAVA_TIME_FORMAT).isSameOrAfter(since);
  });

  return newActivities;
}

/**
 * Return activities
 *
 * @export
 * @param {number} [count=100]
 * @returns {Promise<Array<StravaActivity>>}
 */
export async function getActivities(clubs: Array<InstallationClub>, max: number = 100): Promise<Array<StravaActivity>> {
  const allActivities: Array<StravaActivity> = [];

  logger.log(`${lp} Getting up to ${max} activities for ${clubs.length} clubs`);

  for (const { id, token } of clubs) {
    const options = { access_token: token, per_page: max, id };

    try {
      const activities: Array<StravaActivity> = await listActivities(options);

      if (!activities || activities.length === 0) {
        logger.log(`${lp} Club ${id}: No activities found.`);
        continue;
      }

      logger.log(`${lp} Club ${id}: ${activities.length} activities found`);

      // Strava sometimes refuses to give us ids. Those monsters.
      const fixedActivites = activities.map((a) => {
        if (!a.id) {
          a.id = a.elapsed_time + a.moving_time + a.distance;
        }

        return a;
      });

      allActivities.push(...fixedActivites);
    } catch (error) {
      logger.error(`${id}: Failed to fetch activities`, error);
    }
  }

  return allActivities.slice(0, max);
}

/**
 * StravaActivity comes in, InstallationActivity comes out
 *
 * @param {StravaActivity} input
 * @returns {InstallationActivity}
 */
export function getInstallationActivity(input: StravaActivity): InstallationActivity {
  return {
    id: input.id,
    ts: getStravaTimestamp(input.start_date)
  };
}

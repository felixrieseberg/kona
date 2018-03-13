import * as moment from 'moment';
import { STRAVA_TIME_FORMAT } from '../strava';

/**
 * Get a timestamp from a Strava date
 *
 * @param {string} input
 * @returns {number}
 */
export function getStravaTimestamp(input: string): number {
  return moment(input, STRAVA_TIME_FORMAT).valueOf();
}

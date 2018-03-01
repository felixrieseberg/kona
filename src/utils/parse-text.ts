import * as moment from 'moment';

const RECENT = /recent( \d*)?$/i;
const RECENT_SINCE = /recent since (.*)$/i;

/**
 * Is this a command from `/blob recent since DATE`?
 *
 * @export
 * @param {string} input
 * @returns {{ isRecentSince: boolean; since: moment.Moment }}
 */
export function isRecentSince(input: string): { isRecentSince: boolean; since: moment.Moment } {
  const text = input.trim();

  if (RECENT_SINCE.test(text)) {
    const sinceMatch = text.match(RECENT_SINCE);
    const since = sinceMatch ? findDateTime(sinceMatch[1]) : null;

    if (since) {
      return { isRecentSince: true, since };
    }
  }

  return { isRecentSince: false, since: moment(moment.now()) };
}

/**
 * Is this a command from `/blob recent`?
 *
 * @export
 * @param {string} input
 * @returns {{ isRecent: boolean; count: number }}
 */
export function isRecent(input: string): { isRecent: boolean; count: number } {
  const text = input.trim();

  if (RECENT.test(text)) {
    const countMatch = text.match(RECENT);
    const count = countMatch && countMatch[1]
      ? parseInt(countMatch[1], 10)
      : 10;

    return { isRecent: true, count };
  }

  return { isRecent: false, count: 0 };
}

/**
 * Finds a date/time element in a string
 *
 * @export
 * @param {string} input
 * @returns {(moment.Moment | null)}
 */
export function findDateTime(input: string): moment.Moment | null {
  let output: string | number | moment.Moment = input.trim();

  // Is since just a bunch of numbers and possibly a timestamp?
  if (output && /^\d{9,13}$/.test(output)) {
    output = parseInt(input, 10);
  }

  output = moment(output);

  return output && output.isValid()
    ? output
    : null;
}

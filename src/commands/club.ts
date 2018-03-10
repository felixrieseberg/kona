import * as Router from 'koa-router';

import { Installation } from '../interfaces';
import { database } from '../database';
import { BB_SLACK_SLASH_COMMAND } from '../config';

const addRegex = /clubs (add|watch|include) (\d{0,10})/i;
const removeRegex = /clubs (remove|unwatch|exclude) (\d{0,10})/i;

const strings = {
  clubs: (installation: Installation) => installation.strava.clubs.join(', '),
  alreadyAdded: (id: number) => `:eyes: We're already watching club ${id}!`,
  added: (id: number, addition: string) => `Got it! We've added ${id} to the list of Strava clubs to watch${addition}`,
  inAdditionTo: (clubs: string) => clubs ? `, in addition to ${clubs}` : '.',
  alreadyRemoved: (id: number) => `:no_good: We weren't watching club ${id}, so we're all good!`,
  removed: (id: number, remainder: string) => `Got it! We've removed ${id} from the list of Strava clubs to watch. ${remainder}`,
  afterRemoval: (clubs: string) => clubs ? `We're still watching ${clubs}.` : `We're now no longer wathing any clubs though.../b`,
  notUnderstood: (id: number) => `:no_good: We did not understand the club you gave us (${id}).`,
  watchingSome: (clubs: string) => `:eyes: We're currently watching the following Strava clubs: ${clubs}`,
  watchingNone: () => `:no_good: We're not watching any clubs yet. Add one with \`${BB_SLACK_SLASH_COMMAND} clubs add\`!`,
  failedGeneric: () => 'We failed to get information about your installation',
  failedDb: (op: string) => `We tried to ${op} the club, but encountered an internal database error :sadness:`
};

/**
 * Safely parse a club id
 *
 * @param {RegExp} regex
 * @param {string} input
 * @returns {number}
 */
function safeParseClub(regex: RegExp, input: string): number {
  const clubId = (input.match(regex) || [])[2];
  return parseInt(clubId || '0', 10);
}

/**
 * Add a club to the list of clubs for an installation.
 *
 * @param {Installation} installation
 * @param {string} input
 * @returns {Promise<string>}
 */
async function addClub(installation: Installation, input: string): Promise<string> {
  const clubs = installation.strava.clubs.join(', ');
  const clubId = safeParseClub(addRegex, input);

  if (clubId) {
    if (installation.strava.clubs.includes(clubId)) {
      return strings.alreadyAdded(clubId);
    }

    installation.strava.clubs.push(clubId);

    try {
      await database.updateInstallation(installation);
    } catch (error) {
      console.log(`Tried to add club, but failed`, error);
      return strings.failedDb(`add`);
    }

    return strings.added(clubId, strings.inAdditionTo(clubs));
  } else {
    return strings.notUnderstood(clubId);
  }
}

/**
 * Remove a club to the list of clubs for an installation.
 *
 * @param {Installation} installation
 * @param {string} input
 * @returns {Promise<string>}
 */
async function removeClub(installation: Installation, input: string): Promise<string> {
  const clubId = safeParseClub(removeRegex, input);

  if (clubId) {
    console.log(`Attempting to remove club ${clubId} for ${installation.slack.teamId}`);

    if (!installation.strava.clubs.includes(clubId)) {
      return strings.alreadyRemoved(clubId);
    }

    installation.strava.clubs = installation.strava.clubs.filter((c) => c !== clubId);
    const clubs = installation.strava.clubs.join(', ');

    try {
      await database.updateInstallation(installation);
    } catch (error) {
      console.log(`Tried to remove club, but failed`, error);
      return strings.failedDb(`remove`);
    }

    return strings.removed(clubId, strings.afterRemoval(clubs));
  } else {
    return strings.notUnderstood(clubId);
  }
}

/**
 * List the clubs we're watching for this installation
 *
 * @param {Installation} installation
 * @param {string} input
 * @returns {Promise<string>}
 */
async function listClubs(installation: Installation, input: string): Promise<string> {
  return installation.strava.clubs.length > 0
    ? strings.watchingSome(strings.clubs(installation))
    : strings.watchingNone();
}

/**
 * Handle a slash command request beginning with `clubs`
 *
 * @param {Router.IRouterContext} ctx
 * @param {string} input
 */
export async function handleClubRequest(ctx: Router.IRouterContext, input: string) {
  let text = '';

  try {
    const { team_id } = ctx.request.body;
    const installation = await database.getInstallationForTeam(team_id);

    if (!installation) throw new Error('Installation not found');

    if (addRegex.test(input)) {
      text = await addClub(installation, input);
    } else if (removeRegex.test(input)) {
      text = await removeClub(installation, input);
    } else {
      text = await listClubs(installation, input);
    }
  } catch (error) {
    console.log(`Tried to get installation, but failed`, error);
    text = strings.failedGeneric();
  }

  ctx.body = { text, response_type: 'ephemeral' };
}

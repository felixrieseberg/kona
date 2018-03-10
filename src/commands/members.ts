import * as Router from 'koa-router';

import { StravaClubWithMembers, SlackMessageAttachment } from '../interfaces';
import { getMembers } from '../strava';
import { database } from '../database';

const strings = {
  failedDb: () => `We tried to get members, but encountered an internal database error :sadness:`
};

/**
 * Takes clubs as returned from Strava and makes them pretty
 *
 * @param {Array<StravaClubWithMembers>} input
 * @returns {Array<SlackMessageAttachment>}
 */
function formatClubsWithMembers(input: Array<StravaClubWithMembers>): Array<SlackMessageAttachment> {
  return input.map(({ club, members }) => {
    const text = members.map((member) => {
      const name = `${member.firstname} ${member.lastname}`;
      const city = member.city ? `(${member.city})` : '';

      return `${name} ${city}\n`;
    }).join('');

    return {
      fallback: '',
      author_name: `${club.name}, ${club.city}`,
      author_link: `https://www.strava.com/clubs/${club.id}`,
      author_icon: club.profile_medium,
      text
    };
  });
}

/**
 * List the members in a given club
 *
 * @param {Router.IRouterContext} ctx
 */
export async function handleMembersRequest(ctx: Router.IRouterContext) {
  let text = '';
  let attachments: Array<SlackMessageAttachment> = [];

  try {
    const { team_id } = ctx.request.body;
    const installation = await database.getInstallationForTeam(team_id);
    if (!installation) throw new Error('No installation found');

    const clubsWithMembers = await getMembers(installation.strava.clubs);

    attachments = formatClubsWithMembers(clubsWithMembers);
    text = attachments && attachments.length > 0
      ? `:family: *Athletes*`
      : 'You requested athletes, but we could not find any clubs';
  } catch (error) {
    text = strings.failedDb();
  }

  ctx.body = { text, response_type: 'ephemeral', attachments };
}

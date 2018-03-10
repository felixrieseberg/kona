import { StravaActivity, SlackMessageAttachment } from '../interfaces';
import { metersToMiles, metersPerSecondToPaceString } from '../math';
import { SPORTS_EMOJI } from '../strava';

/**
 * Format a Strava activity
 *
 * @param {Array<StravaActivity>} input
 * @returns {Array<SlackMessageAttachment>}
 */
export function formatActivities(input: Array<StravaActivity>): Array<SlackMessageAttachment> {
  return input.map((a) => {
    const emoji = SPORTS_EMOJI[a.type] || a.type;
    const distance = metersToMiles(a.distance);
    const pace = metersPerSecondToPaceString(a.average_speed);
    const achievements = a.achievement_count > 0
      ? `:trophy: ${a.achievement_count} achievements!`
      : '';

    return {
      fallback: '',
      author_name: `${a.athlete.firstname} ${a.athlete.lastname}`,
      author_link: `https://www.strava.com/athletes/${a.athlete.username}`,
      author_icon: a.athlete.profile,
      title: `${emoji} ${distance} miles at a ${pace} pace. ${achievements}`,
      title_link: `https://www.strava.com/activities/${a.id}`
    };
  });
}

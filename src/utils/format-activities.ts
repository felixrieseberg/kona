import { StravaActivity, SlackMessageAttachment, Activity } from '../interfaces';
import { metersToMiles, metersPerSecondToPaceString, secondsToDuration, metersPerSecond } from '../math';
import { SPORTS_EMOJI } from '../strava';

export function titleForActivity(a: StravaActivity): string {
  const emoji = SPORTS_EMOJI[a.type] || a.type;
  const distance = metersToMiles(a.distance);
  const avgSpeed = a.average_speed || metersPerSecond(a.distance, a.moving_time);
  const pace = metersPerSecondToPaceString(avgSpeed);
  const achievements = a.achievement_count > 0
    ? `:trophy: ${a.achievement_count} achievements!`
    : '';
  let text = `${distance} miles at a ${pace} pace.`;

  if (a.type === Activity.Swim) {
    text = `${a.distance} meters in ${secondsToDuration(a.elapsed_time)}`;
  } else if (a.type === Activity.Workout || a.type === Activity.Crossfit) {
    text = `for ${secondsToDuration(a.elapsed_time)}`;
  } else if (a.type === Activity.Yoga) {
    text = `for ${secondsToDuration(a.elapsed_time)}`;
  } else if (a.type === Activity.Run) {
    text = `${distance} miles at a ${pace} pace (in ${secondsToDuration(a.elapsed_time)})`;
  }

  return `${emoji} \`${a.name}\`: ${text} ${achievements}`;
}

/**
 * Format a Strava activity
 *
 * @param {Array<StravaActivity>} input
 * @returns {Array<SlackMessageAttachment>}
 */
export function formatActivities(input: Array<StravaActivity>): Array<SlackMessageAttachment> {
  return input.map((a) => {
    return {
      fallback: '',
      author_name: `${a.athlete.firstname} ${a.athlete.lastname}`,
      author_link: `https://www.strava.com/athletes/${a.athlete.username}`,
      author_icon: a.athlete.profile,
      title: titleForActivity(a),
      title_link: `https://www.strava.com/activities/${a.id}`
    };
  });
}

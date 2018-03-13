import * as moment from 'moment';
import { getStravaTimestamp } from '../../src/utils/strava-ts';

describe('getStravaTimestamp', () => {
  it('correctly finds a timestamp (clean data)', () => {
    const output = getStravaTimestamp('2018-02-16T18:18:20Z');
    expect(output).toEqual(1518805080200);
  });
});

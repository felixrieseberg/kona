import * as moment from 'moment';

jest.mock('strava-v3', () => ({
  clubs: {
    listActivities: (options, callback) => {
      const activites = require('./mocks/activities.json');
      callback(undefined, activites);
    }
  }
}));
jest.mock('../src/config', () => ({
  BB_STRAVA_CLUBS: [{ id: 336978 }],
  BB_STRAVA_TOKEN: '123'
}));

describe('getActivities', () => {
  const { getActivities, getActivitiesSince, STRAVA_TIME_FORMAT } = require('../src/strava');

  it('gets activites with a count', async () => {
    const activites = await getActivities(10);
    expect(activites).toHaveLength(10);
  });

  it('gets activites without a count', async () => {
    const activites = await getActivities();
    expect(activites).toHaveLength(10);
  });

  it('gets activites since a certain date', async () => {
    const since = moment('2018-02-25T17:01:00Z', STRAVA_TIME_FORMAT)
    const activites = await getActivitiesSince(since);
    expect(activites).toHaveLength(9);
  });

  it('gets activites since a certain date', async () => {
    const since = moment('2019-02-25T17:01:00Z', STRAVA_TIME_FORMAT)
    const activites = await getActivitiesSince(since);
    expect(activites).toHaveLength(0);
  });
})

import * as moment from 'moment';

jest.mock('strava-v3', () => ({
  clubs: {
    listMembers: (options, callback) => {
      const members = require('./mocks/members.json');
      callback(undefined, members);
    },
    listActivities: (options, callback) => {
      const activites = require('./mocks/activities.json');
      callback(undefined, activites);
    },
    get: (options, callback) => {
      const club = require('./mocks/club.json');
      callback(undefined, club);
    },
  },
  athlete: {
    listClubs: (options, callback) => {
      const club = require('./mocks/club.json');
      callback(undefined, [ club ]);
    },
  }
}));
jest.mock('../src/config', () => ({
  BB_STRAVA_TOKEN: '123'
}));

describe('getActivities', () => {
  const { getActivities, getActivitiesSince, STRAVA_TIME_FORMAT } = require('../src/strava');

  it('gets activites with a count', async () => {
    const activites = await getActivities([ { id: '336978' } ], 10);
    expect(activites).toHaveLength(10);
  });

  it('gets activites without a count', async () => {
    const activites = await getActivities([ { id: '336978' } ]);
    expect(activites).toHaveLength(20);
  });

  it('gets activites since a certain date', async () => {
    const since = moment('2018-02-25T17:01:00Z', STRAVA_TIME_FORMAT);
    const activites = await getActivitiesSince(since, [ { id: '336978' } ]);
    expect(activites).toHaveLength(9);
  });

  it('gets activites since a certain date', async () => {
    const since = moment('2019-02-25T17:01:00Z', STRAVA_TIME_FORMAT);
    const activites = await getActivitiesSince(since, [ { id: '336978' } ]);
    expect(activites).toHaveLength(0);
  });
});

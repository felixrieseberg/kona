import * as moment from 'moment';
import { findDateTime, isRecent, isRecentSince } from '../../src/utils/parse-text';

describe('findDateTime', () => {
  it('correctly finds a timestamp (clean data)', () => {
    const expected = moment(1519821037147);
    const output = findDateTime('1519821037147');

    expect(expected.isSame(output)).toBe(true);
  });

  it('correctly finds a timestamp (dirty data)', () => {
    const expected = moment(1519821037147);
    const output = findDateTime('  1519821037147  ');

    expect(expected.isSame(output)).toBe(true);
  });

  it('correctly finds a date element', () => {
    const expected = moment(1519821037000);
    const output = findDateTime('2018-02-28T14:30:37');

    expect(expected.isSame(output)).toBe(true);
  });

  it('correctly returns null for garbage', () => {
    const output = findDateTime('sdfsdfsdfsdf');

    expect(output).toBe(null);
  });
});

describe('isRecentSince', () => {
  it('correctly identifies a "recent since" command', () => {
    const output = isRecentSince('  recent since 1519821037147 ');
    const expectedSince = moment(1519821037147);

    expect(output.isRecentSince).toBeTruthy();
    expect(expectedSince.isSame(output.since)).toBeTruthy();
  });

  it('correctly identifies a "recent since" command (date)', () => {
    const output = isRecentSince('  recent since 2018-01-01 ');
    const expectedSince = moment('2018-01-01');

    expect(output.isRecentSince).toBeTruthy();
    expect(expectedSince.isSame(output.since)).toBeTruthy();
  });

  it('correctly identifies a different command', () => {
    const output = isRecentSince('  recent 2018-01-01 ');
    expect(output.isRecentSince).toBeFalsy();
  });
});

describe('isRecent', () => {
  it('correctly identifies a "recent" command', () => {
    const output = isRecent('  recent ');
    expect(output).toEqual({ isRecent: true, count: 10 });
  });

  it('correctly identifies a "recent" command with number', () => {
    const output = isRecent('  recent 5');
    expect(output).toEqual({ isRecent: true, count: 5 });
  });

  it('correctly identifies a different command', () => {
    const output = isRecent('  debug ');
    expect(output).toEqual({ isRecent: false, count: 0 });
  });
});

import * as moment from 'moment';
import { secondsToDuration } from '../src/math';

describe('math', () => {
  describe('secondsToDuration', () => {
    it('correctly does its thing', () => {
      expect(secondsToDuration(500)).toBe('00:08');
      expect(secondsToDuration(5000)).toBe('01:23');
    });
  });
});

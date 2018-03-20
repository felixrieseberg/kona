import * as moment from 'moment';


// MPS Meters per second
// KMH Kilometers per hour
const METERS_TO_MILES = 0.000621371;
const MPS_TO_KMH = 3.6;
const KMH_TO_MPH = 0.621371;

export function metersToMiles(meters: number) {
  return (meters * METERS_TO_MILES).toFixed(2);
}

export function secondsToDuration(seconds: number) {
  const m = moment.duration(seconds, 'seconds');
  const hours = `${m.hours()}`.padStart(2, '0');
  const minutes = `${m.minutes()}`.padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function metersPerSecondToMilesPace(mps: number) {
  const milesPerHour = mps * MPS_TO_KMH * KMH_TO_MPH;
  return 60 / milesPerHour;
}

export function milesPaceToString(milesPerHour: number) {
  const fraction = milesPerHour % 1;
  const seconds = parseInt((fraction * 60).toFixed(2), 10);
  const prettySeconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${Math.floor(milesPerHour)}:${prettySeconds}`;
}

export function metersPerSecondToPaceString(mps: number) {
  return milesPaceToString(metersPerSecondToMilesPace(mps));
}

export function metersPerSecond(meters: number, seconds: number): number {
  return meters / seconds;
}

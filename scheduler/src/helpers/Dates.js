import moment from 'moment';

export const SLOTS_PER_DAY = 48;
export const SLOTS_PER_HOUR = SLOTS_PER_DAY / 24;
export const MINUTES_PER_SLOT = 60 / SLOTS_PER_HOUR;

export function getDatesBetweenDates(from, to) {
  let dates = []
  let currentDate = new Date(from);
  while (currentDate <= to) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function getDateRangeLengthDays(from, to) {
  return moment(to).diff(moment(from), 'days');
}

/* Day of week with Monday 0, Sunday 6 */
export function getDayOfWeek(date) {
  return (date.getDay() + 6) % 7; // Monday-0 instead of Sunday-0
}

/* Nearest prior monday, including current date */
export function lastMonday(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - getDayOfWeek(date)
  );
}

/* Nearest later sunday, including current date */
export function nextSunday(date = new Date()) {
  let monday = lastMonday(date);
  return monday.setDate(monday.getDate() + 6);
}

export function equalDates(date1, date2) {
  return (
    date1.getYear() === date2.getYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function cloneDate(dt) {
  return new Date(dt);
}

// Rounds a time to a slot time
function roundToSlot(tm) {
  let dt = cloneDate(tm);
  dt.setMinutes(
    Math.round(tm.getMinutes() / MINUTES_PER_SLOT) * MINUTES_PER_SLOT
  );
  return dt;
}

export function slotNum(tm) {
  return Math.round(60 * tm.getHours() / MINUTES_PER_SLOT) +
    Math.round(tm.getMinutes() / MINUTES_PER_SLOT);
}

export function dateTimeFromDateAndSlot(dt, slot) {
  console.log(dt);
  let newDt = cloneDate(dt);
  console.log(newDt);
  newDt.setHours(0);
  newDt.setMinutes(slot * MINUTES_PER_SLOT);
  return newDt;
}

export function equalSlots(time1, time2) {
  return moment(roundToSlot(time1)).isSame(moment(roundToSlot(time2)));
}

export function addSlots(tm, slots) {
  return moment(tm).add(MINUTES_PER_SLOT * slots, 'minutes').toDate();
}
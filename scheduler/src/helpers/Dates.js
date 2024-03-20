export function getDatesBetweenDates(from, to) {
  let dates = []
  let currentDate = new Date(from);
  while (currentDate <= to) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
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
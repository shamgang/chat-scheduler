import moment from 'moment';

function pad2(int) {
  if (int < 10 && int > -10) {
    return '0' + int.toString();
  } else {
    return int.toString();
  }
}

export function fromIsoNoHyphens(dateStr) {
  return new Date(
    parseInt(dateStr.substring(0, 4), 10),
    parseInt(dateStr.substring(4, 6), 10) - 1,
    parseInt(dateStr.substring(6, 8), 10)
  );
}

export function toIsoNoHyphens(date) {
  return moment(date).format('YYYYMMDD');
}

export function dateTimeFromIsoNoHyphens(dateTimeStr) {
  return moment(dateTimeStr, 'YYYYMMDDHHmm').toDate();
}

export function dateTimeToIsoNoHyphens(dt) {
  return moment(dt).format('YYYYMMDDHHmm');
}

export function parseTimeString(timeStr) {
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = parseInt(timeStr.substring(2, 4), 10);
  return {hour, minute};
}

export function formatTimeString(time) {
  return pad2(time.getHours()) + pad2(time.getMinutes())
}

export function firstCap(string) {
  let result = string[0].toUpperCase();
  result += string.slice(1);
  return result;
}

export function readableDatetimeRange(from, to) {
  const fromMonth = from.toLocaleString('default', { month: 'short' });
  const toMonth = to.toLocaleString('default', { month: 'short' });

  if (from.getFullYear() === to.getFullYear()) {
    if (fromMonth === toMonth) {
      return `${fromMonth} ${from.getDate()}-${to.getDate()} ${from.getFullYear()}`;
    } else {
      return `${fromMonth} ${from.getDate()} - ${toMonth} ${to.getDate()} ${from.getFullYear()}`;
    }
  } else {
    return `${fromMonth} ${from.getDate()} ${from.getFullYear()} - ${toMonth} ${to.getDate()} ${to.getFullYear()}`;
  }
}

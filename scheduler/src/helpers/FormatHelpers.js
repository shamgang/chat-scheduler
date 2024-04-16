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

export function parseTimeString(timeStr) {
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = parseInt(timeStr.substring(2, 4), 10);
  return {hour, minute};
}

export function formatTimeString(time) {
  return pad2(time.getHours()) + pad2(time.getMinutes())
}

export function parseTimeRanges(timeRangesJsonFormat) {
  let result = []
  for (const day of timeRangesJsonFormat) {
    let dayResult = []
    for (const timeRange of day) {
      dayResult.push({
        from: parseTimeString(timeRange.from),
        to: parseTimeString(timeRange.to)
      });
    }
    result.push(dayResult);
  }
  return result;
}

export function parseFoundTimes(foundTimesJsonFormat) {
  let result = {}
  for (const [numAttendees, ranges] of Object.entries(foundTimesJsonFormat)) {
    let numAttendeesResult = []
    for (const range of ranges) {
      numAttendeesResult.push({
        date: fromIsoNoHyphens(range.date),
        from: parseTimeString(range.from),
        to: parseTimeString(range.to)
      });
    }
    result[numAttendees] = numAttendeesResult;
  }
  return result;
}

export function formatFoundTimes(foundTimes) {
  let result = {}
  for (const [numAttendees, ranges] of Object.entries(foundTimes)) {
    let numAttendeesResult = []
    for (const range of ranges) {
      numAttendeesResult.push({
        date: toIsoNoHyphens(range.date),
        from: formatTimeString(range.from),
        to: formatTimeString(range.to)
      });
    }
    result[numAttendees] = numAttendeesResult;
  }
  return result;
}
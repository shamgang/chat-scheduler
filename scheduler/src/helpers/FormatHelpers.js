export function fromIsoNoHyphens(dateStr) {
  return new Date(
    parseInt(dateStr.substring(0, 4), 10),
    parseInt(dateStr.substring(4, 6), 10) - 1,
    parseInt(dateStr.substring(6, 8), 10)
  );
}

export function parseTimeString(timeStr) {
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = parseInt(timeStr.substring(2, 4), 10);
  return {hour, minute};
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
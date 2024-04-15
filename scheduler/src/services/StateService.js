import { parseTimeRanges, fromIsoNoHyphens } from "../helpers/FormatHelpers";

function parseEventState(eventState) {
  let timeRanges = {}
  for (const name of Object.keys(eventState.timeRanges)) {
    timeRanges[name] = {}
    for (const key of Object.keys(eventState.timeRanges[name])) {
      timeRanges[name][key] = parseTimeRanges(eventState.timeRanges[name][key])
    }
  }
  return {
    chosenDates: {
      from: fromIsoNoHyphens(eventState.chosenDates.from),
      to: fromIsoNoHyphens(eventState.chosenDates.to)
    },
    generalAvailConfirmed: eventState.generalAvailConfirmed,
    timeRanges: timeRanges
  }
}

export async function getEventState(eventId) {
  const url = `/state/${eventId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  const eventState = parseEventState(await response.json());
  return eventState;
}

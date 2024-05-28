import moment from 'moment';
import { momentLocalizer } from 'react-big-calendar';
import { dateTimeFromDateAndSlot } from './Dates';
import { dateTimeFromIsoNoHyphens } from './FormatHelpers';

moment.locale('en-us', {
  week: {
    dow: 1 // Monday as first day of week
  }
});
export const localizer = momentLocalizer(moment);

export const BASE_COLOR = 'white';

// Return a color based on what proportion of people are available for a slot
export function availabilityColor(proportion) {
  if (proportion === 0) {
    return BASE_COLOR;
  }
  const lightness = 100 - Math.round(proportion * 100 / 2);
  return `hsl(240 30% ${lightness}%)`;
  
}

// Takes time grid or null, and array of names (not null)
// Returns { from, to, numAttendees } if a slot is found, containing the earliest datetime range
// for a meeting with the most possible attendees and the number of attendees.
// Returns { numAttendees: 0 } if no options is available.
export function findBestTime(timeGrid, names) {
  if (!timeGrid) {
    return { numAttendees: 0 };
  }
  for (let numAttendees = names.length; numAttendees > 0; numAttendees--) {
    for (const [day, slots] of Object.entries(timeGrid)) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].length === numAttendees) {
          let j = i + 1;
          let lag = new Set(slots[i]);
          let lead = new Set(slots[j]);
          while(j < 48 && lag.isSubsetOf(lead) && lag.isSupersetOf(lead)) {
            j++;
            lead = new Set(slots[j]);
          }
          const from = dateTimeFromDateAndSlot(dateTimeFromIsoNoHyphens(day), i);
          const to = dateTimeFromDateAndSlot(dateTimeFromIsoNoHyphens(day), j);
          return { from, to, numAttendees };
        }
      }
    }
  }
  return { numAttendees: 0 };
}
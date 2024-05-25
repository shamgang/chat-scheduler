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
export function findBestTime(timeGrid, names) {
  const fail = 'No times are available';
  if (!timeGrid) {
    return fail;
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
          const dateFormatter = new Intl.DateTimeFormat('en-us', {
            weekday: 'short', month: 'short', day: 'numeric'
          });
          const timeFormatter = new Intl.DateTimeFormat('en-us', {
            hour: 'numeric', minute: 'numeric', hour12: true
          });
          console.log(dateTimeFromIsoNoHyphens(day));
          console.log(i); // TODO: test this
          const from = dateTimeFromDateAndSlot(dateTimeFromIsoNoHyphens(day), i);
          console.log(from);
          const to = dateTimeFromDateAndSlot(dateTimeFromIsoNoHyphens(day), j);
          console.log(to);
          const datePart = dateFormatter.format(from);
          const fromTime = timeFormatter.format(from);
          const toTime = timeFormatter.format(to);
          return `The nearest slot with ${numAttendees}/${names.length} attendees is ${datePart} ${fromTime} - ${toTime}`;
        }
      }
    }
  }
  return fail;
}
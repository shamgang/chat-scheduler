import moment from 'moment';
import { momentLocalizer } from 'react-big-calendar';

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
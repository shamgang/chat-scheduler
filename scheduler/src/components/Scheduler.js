import { useMemo, useCallback } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

/* Convert a 2D array of days of week and time ranges to events */
function eventsFromTimeRanges(timeRanges, fromDate, toDate) {
  let events = [];
  let currentDate = new Date(fromDate);
  // Loop through each day between the start and end dates
  while (currentDate <= toDate) {
    const dayOfWeek = (currentDate.getDay() + 6) % 7; // Monday is 0
    const ranges = timeRanges[dayOfWeek];
    for (const range of ranges) {
      const eventStart = new Date(currentDate);
      eventStart.setHours(range.from.hour);
      eventStart.setMinutes(range.from.minute);
      const eventEnd = new Date(currentDate);
      eventEnd.setHours(range.to.hour);
      eventEnd.setMinutes(range.to.minute);
      if (range.to.hour == 0 && range.to.minute == 0) {
        // Midnight should roll back to 11:59 for calendar formatting
        eventEnd.setHours(23);
        eventEnd.setMinutes(59);
      }
      events.push({
        start: eventStart,
        end: eventEnd
      });
    }
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }
  return events;
}

function Scheduler({ dateRange, timeRanges }) {
  const { style, defaultView, views } = useMemo(() => ({
    style: { height: 500 },
    events: [],
    defaultView: Views.WEEK,
    views: [Views.WEEK]
  }), []);

  const events = useMemo(() => {
    return eventsFromTimeRanges(timeRanges, dateRange[0], dateRange[1]);
  }, [dateRange, timeRanges]);

  const defaultDate = useMemo(() => {
    return dateRange[0];
  }, [dateRange]);

  const onSelectSlot = useCallback(({ start, end }) => {
    console.log(start, end);
  }, []);

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={style}
        defaultView={defaultView}
        views={views}
        defaultDate={defaultDate}
        selectable
        onSelectSlot={onSelectSlot}
      />
    </div>
  );
}

export default Scheduler;

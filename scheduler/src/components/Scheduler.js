import { useMemo, useCallback, useState, useEffect } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { GENERAL_AVAIL_KEY, toIsoNoHyphens } from '../services/MessageService';
import { getDatesBetweenDates, getDayOfWeek, lastMonday, nextSunday } from '../helpers/Dates';
import { fromIsoNoHyphens } from '../helpers/FormatHelpers'

moment.locale('en-us', {
  week: {
    dow: 1 // Monday as first day of week
  }
});
const localizer = momentLocalizer(moment)

/* Convert a time range from: {hour, minute}, to: {hour, minute} on a date to an event */
function eventFromTimeRange(currentDate, from, to) {
  const eventStart = new Date(currentDate);
  eventStart.setHours(from.hour);
  eventStart.setMinutes(from.minute);
  const eventEnd = new Date(currentDate);
  eventEnd.setHours(to.hour);
  eventEnd.setMinutes(to.minute);
  if (to.hour === 0 && to.minute === 0) {
    // Midnight should roll back to 11:59 for calendar formatting
    eventEnd.setHours(23);
    eventEnd.setMinutes(59);
  }
  return {
    start: eventStart,
    end: eventEnd
  };
}

/* Calculate all time ranges from a map of week -> 3D time ranges array
    Where week can be a specific monday or general availability,
    and the time ranges are organized by day of week, list of time ranges,
    time range of format { from: {hour, minute}, to: {hour, minute} }.
*/
function eventsFromTimeRanges(timeRanges, fromDate, toDate) {
  if (!timeRanges) {
    return [];
  }
  let events = [];
  const dates = getDatesBetweenDates(fromDate, toDate).map(toIsoNoHyphens);
  const weeks = (
    Object.keys(timeRanges)
    .filter(key => key !== GENERAL_AVAIL_KEY)
  );
  // Populate specific avail first, then fill in any remaining
  // dates with general avail
  let visited = new Array(dates.length).fill(false);
  for (const week of weeks) {
    for (let day = 0; day < 7; day++) {
      const todayRanges = timeRanges[week][day];
      const monday = fromIsoNoHyphens(week);
      // day is days since Monday - today is Monday + day
      const today = new Date(monday).setDate(monday.getDate() + day);
      if (today < fromDate || today > toDate) {
        continue;
      }
      for (const { from, to } of todayRanges) {
        events.push(eventFromTimeRange(today, from, to));
      }
      visited[dates.indexOf(toIsoNoHyphens(today))] = true;
    }
  }
  for (let i = 0; i < dates.length; i++) {
    if (!visited[i]) {
      const dateObj = fromIsoNoHyphens(dates[i]);
      const day = getDayOfWeek(dateObj); // Sunday-0 to Monday-0
      const todayRanges = timeRanges[GENERAL_AVAIL_KEY][day];
      for (const { from, to } of todayRanges) {
        events.push(eventFromTimeRange(dateObj, from, to));
      }
    }
  }
  return events;
}

function Scheduler({
  dateRange,
  timeRanges, 
  onConfirm,
  setCurrentWeek,
  onSelectEvent,
  onSelectSlot
}) {
  const [focusedDate, setFocusedDate] = useState(dateRange[0]); // must be a Monday

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

  const onNavigate = useCallback((date) => {
    const monday = lastMonday(date);
    const sunday = nextSunday(date);
    if (monday <= dateRange[1] && sunday >= dateRange[0]) {
      // Desired week is in range, allow navigation
      setFocusedDate(monday);
    }
  }, [dateRange, setFocusedDate]);

  // When the user navigates, report the change up
  // NOTE: assumes focusedDate is a Monday
  useEffect(() => {
    setCurrentWeek(focusedDate);
  }, [focusedDate, setCurrentWeek]);

  const dateCellWrapper = ({value, children, resource}) => {
    const isOut = (
      value < dateRange[0] ||
      (value > dateRange[1] && value.getDate() > dateRange[1].getDate())
    );
    const isLabel = resource === undefined;
    const style = {
      display: 'flex',
      flex: 1,
      borderLeft: '1px solid #DDD',
      backgroundColor: isOut && !isLabel ? 'lightgrey' : null
    };
    return <div style={style}>{children}</div>;
  };

  const onSelectSlotHelper = useCallback(({action, start, end}) => {
    if (action === 'select') {
      onSelectSlot({start, end});
    }
  }, [onSelectSlot]);

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        style={style}
        defaultView={defaultView}
        views={views}
        defaultDate={defaultDate}
        selectable={'ignoreEvents'}
        onSelectSlot={onSelectSlotHelper}
        onSelectEvent={onSelectEvent}
        date={focusedDate}
        onNavigate={onNavigate}
        components={{
          timeSlotWrapper: dateCellWrapper
        }}
      />
      <button id='scheduler-submit' onClick={onConfirm}>OK</button>
    </div>
  );
}

export default Scheduler;

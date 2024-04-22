import { useMemo, useCallback, useState, useEffect, Children, cloneElement } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { GENERAL_AVAIL_KEY } from '../services/MessageService';
import {
  getDatesBetweenDates,
  getDayOfWeek,
  lastMonday,
  nextSunday,
  cloneDate,
  equalSlots,
  addSlots
} from '../helpers/Dates';
import { fromIsoNoHyphens, toIsoNoHyphens } from '../helpers/FormatHelpers'
import './Calendar.css';
import './Scheduler.css';
import { CustomToolbar } from './Calendar';

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
function eventsFromTimeRanges(timeRanges, currentUser, fromDate, toDate) {
  if (!timeRanges || !(currentUser in timeRanges)) {
    return [];
  }
  let events = [];
  const dates = getDatesBetweenDates(fromDate, toDate).map(toIsoNoHyphens);
  const weeks = (
    Object.keys(timeRanges[currentUser])
    .filter(key => key !== GENERAL_AVAIL_KEY)
  );
  // Populate specific avail first, then fill in any remaining
  // dates with general avail
  let visited = new Array(dates.length).fill(false);
  for (const week of weeks) {
    for (let day = 0; day < 7; day++) {
      const todayRanges = timeRanges[currentUser][week][day];
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
  if (GENERAL_AVAIL_KEY in timeRanges[currentUser]) {
    for (let i = 0; i < dates.length; i++) {
      if (!visited[i]) {
        const dateObj = fromIsoNoHyphens(dates[i]);
        const day = getDayOfWeek(dateObj); // Sunday-0 to Monday-0
        const todayRanges = timeRanges[currentUser][GENERAL_AVAIL_KEY][day];
        for (const { from, to } of todayRanges) {
          events.push(eventFromTimeRange(dateObj, from, to));
        }
      }
    }
  }
  return events;
}

// Check is a time is in a dateRange [start, end]
function isOut(slot, dateRange) {
  return (
    slot < dateRange[0] ||
    (slot > dateRange[1] && slot.getDate() > dateRange[1].getDate())
  );
}

const TimeSlotWrapper = ({value, children, resource, dateRange, onSlotTap}) => {
  const isLabel = resource === undefined;
  const style = {
    display: 'flex',
    flex: 1,
    borderLeft: '1px solid #DDD',
    backgroundColor: isOut(value, dateRange) && !isLabel ? 'lightgrey' : null
  };
  return cloneElement(Children.only(children), {
    style: style,
    onTouchEnd: () => {
      onSlotTap(value);
    }
  });
};

function Scheduler({
  dateRange,
  timeRanges, 
  onConfirm,
  setCurrentWeek,
  selectable,
  onSelectEvent,
  onSelectSlot,
  currentUser,
}) {
  const [focusedDate, setFocusedDate] = useState(lastMonday(dateRange[0]));
  // Track current selection
  const [rangeStart, setRangeStart] = useState(null);
  const [lastSubmittedRange, setLastSubmittedRange] = useState(null); // for immediate styling

  const { style, defaultView, views } = useMemo(() => ({
    style: { height: 500 },
    events: [],
    defaultView: Views.WEEK,
    views: [Views.WEEK]
  }), []);

  const events = useMemo(() => {
    return eventsFromTimeRanges(timeRanges, currentUser, dateRange[0], dateRange[1]);
  }, [dateRange, timeRanges, currentUser]);

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

  const onSelectEventHelper = useMemo(() => {
    if (selectable) {
      return onSelectEvent;
    } else {
      return () => {};
    }
  }, [selectable, onSelectEvent]);

  const onSelectSlotHelper = useCallback(({action, start, end}) => {
    if (!selectable) {
      return;
    }
    console.log(action, start, end);
    if (action === 'select' && !isOut(start, dateRange)) {
      // Click-drag
      setLastSubmittedRange([start, end]);
      if (rangeStart) {
        setRangeStart(null);
      }
      onSelectSlot({start, end});
    } else if (action === 'click') {
      if (rangeStart) {
        // Ending a selection
        // Handle both forward and backward selection
        // Drag-selection protects against crossing the day boundary,
        // and we must manually protect here - ignore the day on the end time
        // and assume it's always the same day as start
        let slotStart, slotEnd;
        if (start >= rangeStart) {
          // Forward selection
          slotStart = cloneDate(rangeStart);
          slotEnd = cloneDate(slotStart);
          slotEnd.setHours(end.getHours());
          slotEnd.setMinutes(end.getMinutes());
        } else {
          // Backward selection
          slotEnd = addSlots(rangeStart, 1); // add a slot because exclusive end
          slotStart = cloneDate(slotEnd);
          slotStart.setHours(start.getHours());
          slotStart.setMinutes(start.getMinutes());
        }
        setLastSubmittedRange([slotStart, slotEnd]);
        onSelectSlot({start: slotStart, end: slotEnd});
        setRangeStart(null);
      } else {
        // Starting a selection
        setRangeStart(start);
      }
    }
  }, [selectable, onSelectSlot, dateRange, rangeStart, setRangeStart, setLastSubmittedRange]);

  // When the new time ranges come in, clear the placeholder selection
  useEffect(() => {
    setLastSubmittedRange(null);
  }, [timeRanges]);

  const onSlotTap = useCallback((value) => {
    const end = addSlots(value, 1);
    onSelectSlotHelper({action: 'click', start: value, end});
  }, [onSelectSlotHelper]);

  const slotPropGetter = useCallback((slot) => {
    if (
      (rangeStart && equalSlots(slot, rangeStart)) ||
      (lastSubmittedRange && slot >= lastSubmittedRange[0] && slot < lastSubmittedRange[1])
    ) {
      return { className: 'time-slot-selecting' };
    } else if (isOut(slot, dateRange)) {
      return { className: 'time-slot-out-of-range' };
    } else {
      return { className: 'time-slot-default' };
    }
  }, [rangeStart, dateRange, lastSubmittedRange]);

  const components = useMemo(() => {
    return {
      toolbar: CustomToolbar,
      timeSlotWrapper: (props) => <TimeSlotWrapper {...props} dateRange={dateRange} onSlotTap={onSlotTap} />
    };
  }, [dateRange, onSlotTap]);

  return (
    <div className="calendar-container">
      <Calendar
        className="calendar"
        localizer={localizer}
        events={events}
        style={style}
        defaultView={defaultView}
        views={views}
        defaultDate={defaultDate}
        selectable={'ignoreEvents'}
        onSelectSlot={onSelectSlotHelper}
        onSelectEvent={onSelectEventHelper}
        date={focusedDate}
        onNavigate={onNavigate}
        components={components}
        slotPropGetter={slotPropGetter}
      />
      <button className="calendar-submit" id='scheduler-submit' onClick={onConfirm}>OK</button>
    </div>
  );
}

export default Scheduler;

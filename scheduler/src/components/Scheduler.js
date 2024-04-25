import { useMemo, useCallback, useState, useEffect, Children, cloneElement } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  lastMonday,
  nextSunday,
  cloneDate,
  equalSlots,
  addSlots,
  slotNum
} from '../helpers/Dates';
import { toIsoNoHyphens } from '../helpers/FormatHelpers'
import './Calendar.css';
import './Scheduler.css';
import { CustomToolbar } from './Calendar';

moment.locale('en-us', {
  week: {
    dow: 1 // Monday as first day of week
  }
});
const localizer = momentLocalizer(moment)

const defaultView = Views.WEEK;
const views = [Views.WEEK];

function getSlotColor(slot, timeGrid, names) {
  const baseColor = 'white';
  const slotKey = toIsoNoHyphens(slot);
  if (!timeGrid || !(slotKey in timeGrid)){
    return baseColor;
  }
  const available = timeGrid[toIsoNoHyphens(slot)][slotNum(slot)];
  const proportionAvailable = available.length / names.length;
  const saturation = Math.round(proportionAvailable * 100);
  if(available.length > 0) {
    return `hsl(199 ${saturation}% 50%)`;
  } else {
    return baseColor;
  }
}

// Check if a time is in a dateRange [start, end]
function isOut(slot, dateRange) {
  return (
    slot < dateRange[0] ||
    (slot > dateRange[1] && slot.getDate() > dateRange[1].getDate())
  );
}

const TimeSlotWrapper = ({value, children, resource, onSlotTap}) => {
  return cloneElement(Children.only(children), {
    onTouchEnd: () => {
      onSlotTap(value);
    }
  });
};

function Scheduler({
  dateRange,
  timeGrid, 
  onSubmit,
  submitText,
  setCurrentWeek,
  selectable,
  onSelectEvent,
  onSelectSlot,
  names
}) {
  const [focusedDate, setFocusedDate] = useState(lastMonday(dateRange[0]));
  // Track current selection
  const [rangeStart, setRangeStart] = useState(null);
  const [lastSubmittedRange, setLastSubmittedRange] = useState(null); // for immediate styling

  const defaultDate = dateRange[0];

  const onNavigate = useCallback((date) => {
    const monday = lastMonday(date);
    const sunday = nextSunday(date);
    if (monday <= dateRange[1] && sunday >= dateRange[0]) {
      // Desired week is in range, allow navigation
      setFocusedDate(monday);
      setCurrentWeek(monday);
    }
  }, [dateRange, setFocusedDate, setCurrentWeek]);

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
  }, [timeGrid]);

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
      return { style: { backgroundColor: getSlotColor(slot, timeGrid, names) } };
    }
  }, [rangeStart, dateRange, lastSubmittedRange, timeGrid]);

  // Memoize modular components
  const components = useMemo(() => {
    return {
      toolbar: CustomToolbar,
      timeSlotWrapper: (props) => <TimeSlotWrapper {...props} onSlotTap={onSlotTap} />
    };
  }, [dateRange, onSlotTap]);

  return (
    <div className="calendar-container">
      <Calendar
        className="calendar"
        localizer={localizer}
        defaultView={defaultView}
        views={views}
        defaultDate={defaultDate}
        selectable={true}
        onSelectSlot={onSelectSlotHelper}
        date={focusedDate}
        onNavigate={onNavigate}
        components={components}
        slotPropGetter={slotPropGetter}
      />
      <button className="calendar-submit" id='scheduler-submit' onClick={onSubmit}>{submitText}</button>
    </div>
  );
}

export default Scheduler;

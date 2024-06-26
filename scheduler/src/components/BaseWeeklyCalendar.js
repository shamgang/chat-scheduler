import { useMemo, useCallback, useState, useEffect } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  cloneDate,
  addSlots,
  equalSlots
} from '../helpers/Dates';
import TimeSlotWrapper from './TimeSlotWrapper';
import { localizer, availabilityColor } from '../helpers/CalendarHelpers';
import './CalendarCommon.css';
import './WeeklyCalendar.css';

const defaultView = Views.WEEK;
const views = [Views.WEEK];

function BaseWeeklyCalendar({
  timeGrid,
  selectable,
  isOut,
  onSelectSlot,
  onSlotHover,
  getSlotFullness,
  slotGlows,
  userIsAvail,
  calendarProps,
  calendarComponents,
  outlinedRanges
}) {
  // Track current selection
  const [rangeStart, setRangeStart] = useState(null);
  const [lastSubmittedRange, setLastSubmittedRange] = useState(null); // for immediate styling

  const onSelectSlotHelper = useCallback(({action, start, end}) => {
    if (!selectable) {
      return;
    }
    if (action === 'select' && !isOut(start)) {
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
  }, [isOut, selectable, onSelectSlot, rangeStart, setRangeStart, setLastSubmittedRange]);

  // When the new time ranges come in, clear the placeholder selection
  useEffect(() => {
    setLastSubmittedRange(null);
  }, [timeGrid]);

  const onSlotTap = useCallback((value) => {
    const end = addSlots(value, 1);
    onSelectSlotHelper({action: 'click', start: value, end});
  }, [onSelectSlotHelper]);

  const slotPropGetterHelper = useCallback((slot) => {
    if (isOut(slot)) {
      return { className: 'time-slot-out-of-range' };
    }
    let result = {
      className: userIsAvail(slot) ? 'time-slot-user' : ''
    };
    if (
      (rangeStart && equalSlots(slot, rangeStart)) ||
      (lastSubmittedRange && slot >= lastSubmittedRange[0] && slot < lastSubmittedRange[1])
    ) {
      result.className += ' time-slot-selecting';
    } else if (slotGlows && slotGlows(slot)) {
      result.className += ' time-slot-glowing';
    } else {
      result.style = { 
        backgroundColor: availabilityColor(getSlotFullness(slot))
      };
    }
    return result;
  }, [rangeStart, lastSubmittedRange, isOut, getSlotFullness, slotGlows, userIsAvail]);

  // Memoize modular components
  const combinedComponents = useMemo(() => {
    return {
      ...calendarComponents,
      timeSlotWrapper: (props) => <TimeSlotWrapper {...props} onSlotTap={onSlotTap} onSlotHover={onSlotHover} />
    };
  }, [calendarComponents, onSlotTap, onSlotHover]);

  const events = outlinedRanges ? outlinedRanges.map(({from, to}) => {
    return { start: from, end: to };
  }) : [];

  return (
    <Calendar
      className="calendar"
      localizer={localizer}
      defaultView={defaultView}
      views={views}
      onSelectSlot={onSelectSlotHelper}
      components={combinedComponents}
      selectable={selectable}
      slotPropGetter={slotPropGetterHelper}
      events={events}
      {...calendarProps}
    />
  );
}

export default BaseWeeklyCalendar;

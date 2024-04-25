import { useMemo, useCallback, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  lastMonday,
  nextSunday,
  slotNum
} from '../helpers/Dates';
import { toIsoNoHyphens } from '../helpers/FormatHelpers'
import { CalendarToolbar } from './CalendarToolbar';
import BaseWeeklyCalendar from './BaseWeeklyCalendar';

function getSlotNames(slot, timeGrid) {
  const slotKey = toIsoNoHyphens(slot);
  if (!timeGrid || !(slotKey in timeGrid)){
    return [];
  }
  return timeGrid[toIsoNoHyphens(slot)][slotNum(slot)];
}

function getSlotFullness(slot, timeGrid, names, editingName) {
  const slotKey = toIsoNoHyphens(slot);
  if (!timeGrid || !(slotKey in timeGrid)){
    return 0;
  }
  const available = getSlotNames(slot, timeGrid);
  if (editingName) {
    // Show only this user avail
    if (available.includes(editingName)) {
      return 1;
    } else {
      return 0;
    }
  } else {
    // Show all users, color coded
    if(available.length > 0) {
      return available.length / names.length;
    } else {
      return 0;
    }
  }
}

// Check if a time is in a dateRange [start, end]
function isOut(slot, dateRange) {
  return (
    slot < dateRange[0] ||
    (slot > dateRange[1] && slot.getDate() > dateRange[1].getDate())
  );
}

function SpecificWeeklyCalendar({
  dateRange,
  timeGrid, 
  onSubmit,
  submitText,
  setCurrentWeek,
  selectable,
  onSelectSlot,
  names,
  editingName
}) {
  const [focusedDate, setFocusedDate] = useState(lastMonday(dateRange[0]));
  const [focusedSlotNames, setFocusedSlotNames] = useState(null);

  const onNavigate = useCallback((date) => {
    const monday = lastMonday(date);
    const sunday = nextSunday(date);
    if (monday <= dateRange[1] && sunday >= dateRange[0]) {
      // Desired week is in range, allow navigation
      setFocusedDate(monday);
      setCurrentWeek(monday);
    }
  }, [dateRange, setFocusedDate, setCurrentWeek]);

  const isOutHelper = useCallback((slot) => {
    return isOut(slot, dateRange);
  }, [dateRange]);

  const getSlotFullnessHelper = useCallback((slot) => {
    return getSlotFullness(slot, timeGrid, names, editingName);
  }, [timeGrid, names, editingName]);

  const slotGlowsHelper = useCallback((slot) => {
    return names && names.length > 1 && !editingName && getSlotFullness(slot, timeGrid, names, editingName) === 1;
  }, [names, timeGrid, editingName]);

  const onSlotHover = useCallback((slot) => {
    setFocusedSlotNames(getSlotNames(slot, timeGrid));
  }, [timeGrid, setFocusedSlotNames]);

  const calendarProps = useMemo(() => {
    return {
      defaultDate: dateRange[0],
      date: focusedDate,
      onNavigate: onNavigate
    }
  }, [dateRange, focusedDate, onNavigate]);

  // Memoize modular components
  const components = useMemo(() => {
    return {
      toolbar: CalendarToolbar,
    };
  }, []);

  return (
    <div className='calendar-container'>
      <BaseWeeklyCalendar
        timeGrid={timeGrid}
        selectable={selectable}
        isOut={isOutHelper}
        onSelectSlot={onSelectSlot}
        onSlotHover={onSlotHover}
        getSlotFullness={getSlotFullnessHelper}
        slotGlows={slotGlowsHelper}
        calendarProps={calendarProps}
        calendarComponents={components}
      >
      </BaseWeeklyCalendar>
      <button className="calendar-submit" id='scheduler-submit' onClick={onSubmit}>{submitText}</button>
      {
        !editingName && focusedSlotNames && focusedSlotNames.length > 0 &&
        <Tooltip anchorSelect='.slot-anchor' place="top">
          {
            focusedSlotNames && focusedSlotNames.map(name => <div key={'tooltip-name-' + name}>{name}</div>)
          }
        </Tooltip>}
    </div>
  );
}

export default SpecificWeeklyCalendar;

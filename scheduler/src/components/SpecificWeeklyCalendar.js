import { useMemo, useCallback, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
  lastMonday,
  nextSunday,
  slotNum,
  equalDates
} from '../helpers/Dates';
import { toIsoNoHyphens, firstCap } from '../helpers/FormatHelpers'
import { CalendarToolbar } from './CalendarToolbar';
import BaseWeeklyCalendar from './BaseWeeklyCalendar';

function getSlotNames(slot, timeGrid) {
  const slotKey = toIsoNoHyphens(slot);
  if (!timeGrid || !(slotKey in timeGrid)){
    return [];
  }
  return timeGrid[toIsoNoHyphens(slot)][slotNum(slot)].map(nm => nm.trim().toLowerCase());
}

function getSlotFullness(slot, timeGrid, names) {
  const available = getSlotNames(slot, timeGrid);
  if(available.length > 0) {
    return available.length / names.length;
  } else {
    return 0;
  }
}

function userIsAvail(slot, timeGrid, editingName) {
  const available = getSlotNames(slot, timeGrid);
  return available.includes(editingName);
}

// Check if a time is in a dateRange [start, end]
function isOut(slot, dateRange) {
  return (
    slot < dateRange[0] ||
    (slot > dateRange[1] && !equalDates(slot, dateRange[1]))
  );
}

function SpecificWeeklyCalendar({
  dateRange,
  timeGrid,
  setCurrentWeek,
  selectable,
  onSelectSlot,
  names,
  editingName,
  showButtons,
  onSubmit,
  outlinedRanges
}) {
  const [focusedDate, setFocusedDate] = useState(lastMonday(dateRange[0]));
  const [focusedSlotNames, setFocusedSlotNames] = useState(null);

  const inRange = useCallback((date) => {
    const monday = lastMonday(date);
    const sunday = nextSunday(date);
    return monday <= dateRange[1] && sunday >= dateRange[0];
  }, [dateRange]);

  const onNavigate = useCallback((date) => {
    if (inRange(date)) {
      // Desired week is in range, allow navigation
      const monday = lastMonday(date);
      setFocusedDate(monday);
      setCurrentWeek(monday);
    }
  }, [inRange, setFocusedDate, setCurrentWeek]);

  const isOutHelper = useCallback((slot) => {
    return isOut(slot, dateRange);
  }, [dateRange]);

  const getSlotFullnessHelper = useCallback((slot) => {
    return getSlotFullness(slot, timeGrid, names);
  }, [timeGrid, names]);

  const slotGlowsHelper = useCallback((slot) => {
    return names && names.length > 1 && getSlotFullness(slot, timeGrid, names) === 1;
  }, [names, timeGrid]);

  const userIsAvailHelper = useCallback((slot) => {
    return userIsAvail(slot, timeGrid, editingName);
  }, [timeGrid, editingName]);

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
      toolbar: (props) => <CalendarToolbar {...props} inRange={inRange} />,
    };
  }, [inRange]);

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
        userIsAvail={userIsAvailHelper}
        calendarProps={calendarProps}
        calendarComponents={components}
        outlinedRanges={outlinedRanges}
      >
      </BaseWeeklyCalendar>
      <div className="calendar-footer">
        { 
          showButtons &&
          <button className="calendar-submit" id='calendar-submit' onClick={onSubmit}>
            <FontAwesomeIcon
              icon={faCheck}
            />
          </button>
        }
      </div>
      {
        focusedSlotNames && focusedSlotNames.length > 0 &&
        <Tooltip anchorSelect='.slot-anchor' place="top">
          {
            focusedSlotNames && focusedSlotNames.map(name => <div key={'tooltip-name-' + name}>{firstCap(name)}</div>)
          }
        </Tooltip>
      }
    </div>
  );
}

export default SpecificWeeklyCalendar;

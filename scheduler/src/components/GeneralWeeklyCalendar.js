import { useMemo, useCallback } from 'react';
import {
  slotNum,
  getDayOfWeek
} from '../helpers/Dates';
import { fromIsoNoHyphens } from '../helpers/FormatHelpers';
import { CalendarToolbar } from './CalendarToolbar';
import BaseWeeklyCalendar from './BaseWeeklyCalendar';

function getSlotFullness(slot, timeGrid, name) {
  if (!timeGrid) {
    return 0;
  }
  let slots;
  for (const dt of Object.keys(timeGrid)) {
    if (getDayOfWeek(slot) === getDayOfWeek(fromIsoNoHyphens(dt))) {
      slots = timeGrid[dt]
    }
  }
  if (!slots) {
    return 0;
  }
  if (slots[slotNum(slot)].includes(name)) {
    return 1;
  } else {
    return 0;
  }
}

function GeneralWeeklyCalendar({
  timeGrid,
  name,
  onSubmit,
  selectable,
  onSelectSlot
}) {
  const isOut = useCallback(() => false, []);

  const getSlotFullnessHelper = useCallback((slot) => {
    return getSlotFullness(slot, timeGrid, name);
  }, [timeGrid, name]);

  const calendarProps = useMemo(() => {
    return {
      defaultDate: new Date(),
      formats: {
        dayFormat: (dt) => dt.toLocaleDateString('en-US', { weekday: 'short' })
      }
    }
  }, []);

  // Memoize modular components
  const components = useMemo(() => {
    return {
      toolbar: (props) => {
        let newProps = {...props};
        newProps.label = 'GENERAL';
        return <CalendarToolbar {...newProps} showNav={false} />
      }
    };
  }, []);

  return (
    <BaseWeeklyCalendar
      timeGrid={timeGrid}
      selectable={selectable}
      isOut={isOut}
      onSelectSlot={onSelectSlot}
      getSlotFullness={getSlotFullnessHelper}
      onClick={onSubmit}
      buttonText="OK"
      calendarProps={calendarProps}
      calendarComponents={components}
    />
  );
}

export default GeneralWeeklyCalendar;

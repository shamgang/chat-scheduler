import { useCallback, useRef, useState, Children, cloneElement, useEffect, useMemo } from 'react';
import { Calendar as BigCalendar, Views } from 'react-big-calendar';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { equalDates, cloneDate } from '../helpers/Dates';
import { localizer } from '../helpers/CalendarHelpers';
import { CalendarToolbar } from './CalendarToolbar';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './MonthlyCalendar.css';

function DateCellWrapper({children, value, onRangeSelected}) {
  return cloneElement(Children.only(children), {
    onTouchEnd: () => {
      let end = cloneDate(value);
      end.setDate(end.getDate() + 1); // onRangeSelected expects end-exclusive
      onRangeSelected({ start: value, end: end });
    }
  });
}

function MonthlyCalendar({range, onRangeChanged, onSubmit, submittable}) {
    const calendarRef = useRef(null);
    const [rangeStart, setRangeStart] = useState(null);
    const [focusedDate, setFocusedDate] = useState(range[0]);

    // Nav to start of range when range changes
    useEffect(() => {
      setFocusedDate(range[0]);
    }, [range, setFocusedDate]);

    const onRangeSelected = useCallback((slotInfo) => {
      const start = slotInfo.start;
      let end = cloneDate(slotInfo.end);
      end.setDate(end.getDate() - 1); // slot info is end-exclusive, onRangeChanged expects end-inclusive
      if (equalDates(start, end)) {
        // Only one day selected
        if (!rangeStart) {
          // Don't fire a range change, just log the date clicked as the start of a range
          setRangeStart(start);
        } else {
          // Handle forward and backward selection
          onRangeChanged([
            moment.min(moment(rangeStart), moment(start)).toDate(),
            moment.max(moment(rangeStart), moment(start)).toDate()
          ]);
          setRangeStart(null);
        }
      } else {
        // Range drag-selected
        setRangeStart(null);
        onRangeChanged([start, end]);
      } 
    }, [onRangeChanged, rangeStart, setRangeStart]);

    // Style selected range
    const dayPropGetter = useCallback((dt) => {
      if (rangeStart && equalDates(rangeStart, dt)) {
        // Start date clicked
        return { className: 'date-selecting' };
      } else if (dt >= range[0] && dt <= range[1]) {
        // Currently selected
        return { className: 'date-selected' };
      } else if ((calendarRef.current?.props?.date || calendarRef.current?.props?.getNow())?.getMonth() !== dt.getMonth()) {
        // Out of the month
        return { className: 'date-out-of-month' };
      } else {
        return { className: 'date-default' };
      }
    }, [range, rangeStart]);

    const onNavigate = useCallback((dt) => {
      setFocusedDate(dt);
    }, [setFocusedDate]);

    // Memoize modular components
    const components = useMemo(() => {
      return {
        toolbar: CalendarToolbar,
        dateCellWrapper: (props) => <DateCellWrapper {...props} onRangeSelected={onRangeSelected} />
      };
    }, [onRangeSelected]);

    return (
        <div className="calendar-container">
            <BigCalendar
              ref={calendarRef}
              components={components}
              className='calendar'
              localizer={localizer}
              defaultView={Views.MONTH}
              views={[Views.MONTH]}
              selectable={true}
              onSelectSlot={onRangeSelected}
              dayPropGetter={dayPropGetter}
              date={focusedDate}
              onNavigate={onNavigate}
            />
            <button className={'calendar-submit' + (submittable ? ' enabled' : ' disabled')} id='range-submit' onClick={submittable ? onSubmit : () => {}}>
              <FontAwesomeIcon
                icon={faCheck}
              />
            </button>
        </div>
    );
}


export default MonthlyCalendar;

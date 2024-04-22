import { useCallback, useRef, useState, Children, cloneElement } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesRight, faAnglesLeft } from '@fortawesome/free-solid-svg-icons'
import { Calendar as BigCalendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { equalDates, cloneDate } from '../helpers/Dates';
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Calendar.css';

moment.locale('en-us', {
  week: {
    dow: 1 // Monday as first day of week
  }
});
const localizer = momentLocalizer(moment)

function CustomToolbar({ label, onNavigate }) {
  const onPrev = useCallback(() => {
    onNavigate('PREV');
  }, [onNavigate]);

  const onNext = useCallback(() => {
    onNavigate('NEXT');
  }, [onNavigate]);
  return (
    <div className="calendar-toolbar">
      <span className="calendar-prev" onClick={onPrev}>
        <FontAwesomeIcon
          icon={faAnglesLeft}
          className="calendar-nav-arrow"
        />
      </span>
      <span className="calendar-label">{label}</span>
      <span className="calendar-next" onClick={onNext}>
        <FontAwesomeIcon
          icon={faAnglesRight}
          className="calendar-nav-arrow"
        />
      </span>
    </div>
  );
}

function DateCellWrapper({children, value, onRangeSelected}) {
  return cloneElement(Children.only(children), {
    onTouchEnd: () => {
      let end = cloneDate(value);
      end.setDate(end.getDate() + 1); // onRangeSelected expects end-exclusive
      onRangeSelected({start: value, end: end });
    }
  });
}

function Calendar({range, onRangeChanged, onSubmit}) {
    const calendarRef = useRef(null);
    const [rangeStart, setRangeStart] = useState(null);

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
          onRangeChanged([rangeStart, start]);
          setRangeStart(null);
        }
      } else {
        // Range drag-selected
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

    return (
        <div className="calendar-container">
            <BigCalendar
              ref={calendarRef}
              components={{
                toolbar: CustomToolbar,
                dateCellWrapper: (props) => <DateCellWrapper {...props} onRangeSelected={onRangeSelected} />
              }}
              className='calendar'
              localizer={localizer}
              defaultView={Views.MONTH}
              views={[Views.MONTH]}
              selectable={true}
              onSelectSlot={onRangeSelected}
              dayPropGetter={dayPropGetter}
            />
            <button className='calendar-submit' id='range-submit' onClick={onSubmit}>OK</button>
        </div>
    );
}


export default Calendar;

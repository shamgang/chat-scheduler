import { useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesRight, faAnglesLeft } from '@fortawesome/free-solid-svg-icons';
import { addDays } from '../helpers/Dates';
import './CalendarToolbar.css';

export function CalendarToolbar({ date, label, onNavigate, showNav, inRange }) {

  if (showNav === undefined) {
    showNav = true;
  }

  const onPrev = useCallback(() => {
    onNavigate('PREV');
  }, [onNavigate]);

  const onNext = useCallback(() => {
    onNavigate('NEXT');
  }, [onNavigate]);

  const showPrev = useMemo(() => {
    return showNav && (inRange === undefined || inRange(addDays(date, -7)));
  }, [showNav, inRange, date]);

  const showNext = useMemo(() => {
    return showNav && (inRange === undefined || inRange(addDays(date, 7)));
  }, [showNav, inRange, date]);

  return (
    <div className="calendar-toolbar">
      {
        showPrev &&
        <span className="calendar-prev" onClick={onPrev}>
          <FontAwesomeIcon
            icon={faAnglesLeft}
            className="calendar-nav-arrow"
          />
        </span>
      }
      <span className="calendar-label">{label}</span>
      {
        showNext &&
        <span className="calendar-next" onClick={onNext}>
          <FontAwesomeIcon
            icon={faAnglesRight}
            className="calendar-nav-arrow"
          />
        </span>
      }
    </div>
  );
}

export default CalendarToolbar;
import { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnglesRight, faAnglesLeft } from '@fortawesome/free-solid-svg-icons';
import './CalendarToolbar.css';

export function CalendarToolbar({ label, onNavigate, showNav }) {

  if (!showNav) {
    showNav = true;
  }

  const onPrev = useCallback(() => {
    onNavigate('PREV');
  }, [onNavigate]);

  const onNext = useCallback(() => {
    onNavigate('NEXT');
  }, [onNavigate]);

  return (
    <div className="calendar-toolbar">
      {
        showNav &&
        <span className="calendar-prev" onClick={onPrev}>
          <FontAwesomeIcon
            icon={faAnglesLeft}
            className="calendar-nav-arrow"
          />
        </span>
      }
      <span className="calendar-label">{label}</span>
      {
        showNav &&
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
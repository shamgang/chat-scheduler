import {default as ReactCalendar} from "react-calendar";
import 'react-calendar/dist/Calendar.css';

function Calendar({range, onRangeChanged, onSubmit}) {
    return (
        <div>
            <ReactCalendar
                selectRange={true}
                goToRangeStartOnSelect={false} // broken
                onChange={onRangeChanged}
                value={range}
            />
            <button id='range-submit' onClick={onSubmit}>OK</button>
        </div>
    );
}

export default Calendar;

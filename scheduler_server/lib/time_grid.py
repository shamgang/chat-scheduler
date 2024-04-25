from .config import SLOTS_PER_DAY
from .datetime_helpers import get_dates_between_dates, GENERAL_WEEK_KEY, get_last_monday, get_slot_from_time
from .hour_translation import HourStatementType


class TimeGrid:
    '''A representation of a calendar with a certain slot size, given a range of dates'''
    def __init__(self, from_date, to_date):
        self.grid = {
            dt: [
                []
                for _ in range(SLOTS_PER_DAY)
            ]
            for dt in get_dates_between_dates(from_date, to_date)
        }

    def _get_slots(self, week, day_ind, from_time, to_time):
        for dt in self.grid:
            if (week == GENERAL_WEEK_KEY or get_last_monday(dt) == week) and dt.weekday() == day_ind:
                # Found a matching date
                start_slot = get_slot_from_time(from_time)
                end_slot = get_slot_from_time(to_time)
                if end_slot == 0:
                    end_slot = SLOTS_PER_DAY
                for slot in self.grid[dt][start_slot:end_slot]:
                    yield slot

    def add_availability(self, name, week, day_ind, from_time, to_time):
        for slot in self._get_slots(week, day_ind, from_time, to_time):
            if name not in slot:
                slot.append(name)

    def remove_availability(self, name, week, day_ind, from_time, to_time):
        for slot in self._get_slots(week, day_ind, from_time, to_time):
            if name in slot:
                slot.remove(name)

    def toggle_availability(self, name, week, day_ind, from_time, to_time):
        for slot in self._get_slots(week, day_ind, from_time, to_time):    
            if name in slot:
                slot.remove(name)
            else:
                slot.append(name)

    def process_calendar_actions(self, name, week, actions):
        for action in actions:
            if (action.type == HourStatementType.OPEN):
                self.add_availability(name, week, action.day, action.time_range)
            elif (action.type == HourStatementType.CLOSE):
                self.remove_availability(name, week, action.day, action.time_range)


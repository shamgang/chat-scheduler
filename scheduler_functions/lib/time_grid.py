from datetime import date
from .config import SLOTS_PER_DAY
from .datetime_helpers import (
    get_dates_between_dates,
    GENERAL_WEEK_KEY,
    get_last_monday,
    get_slot_from_time
)
from .model_tools import to_iso_no_hyphens, from_iso_no_hyphens
from .hour_translation import HourStatementType


def slot_range(from_time, to_time):
    start_slot = get_slot_from_time(from_time)
    end_slot = get_slot_from_time(to_time)
    if end_slot == 0:
        end_slot = SLOTS_PER_DAY
    return start_slot, end_slot


class TimeGrid:
    '''A representation of a calendar with a certain slot size, given a range of dates
    Must provide either from_date and to_date or grid.
    '''
    def __init__(self, from_date, to_date):
        self.grid = {
            dt: [
                []
                for _ in range(SLOTS_PER_DAY)
            ]
            for dt in get_dates_between_dates(from_date, to_date)
        }

    def _get_slots_between_times(self, dt, from_time, to_time):
        if dt in self.grid:
            start_slot, end_slot = slot_range(from_time, to_time)
            for slot in self.grid[dt][start_slot:end_slot]:
                yield slot

    def _get_slots(self, week, day_ind, from_time, to_time):
        for dt in self.grid:
            if (week == GENERAL_WEEK_KEY or get_last_monday(dt) == week) and dt.weekday() == day_ind:
                # Found a matching date
                for slot in self._get_slots_between_times(dt, from_time, to_time):
                    yield slot

    def add_availability(self, name, week, day_ind, from_time, to_time):
        for slot in self._get_slots(week, day_ind, from_time, to_time):
            if name not in slot:
                slot.append(name)

    def remove_availability(self, name, week, day_ind, from_time, to_time):
        for slot in self._get_slots(week, day_ind, from_time, to_time):
            if name in slot:
                slot.remove(name)

    def toggle_availability(self, name, dt, from_time, to_time):
        for slot in self._get_slots_between_times(dt, from_time, to_time):    
            if name in slot:
                slot.remove(name)
            else:
                slot.append(name)

    def toggle_general_availability(self, name, day, from_time, to_time):
        for slot in self._get_slots(GENERAL_WEEK_KEY, day, from_time, to_time):    
            if name in slot:
                slot.remove(name)
            else:
                slot.append(name)

    def process_calendar_actions(self, name, week, actions):
        for action in actions:
            if (action.type == HourStatementType.OPEN):
                self.add_availability(name, week, action.day, action.from_time, action.to_time)
            elif (action.type == HourStatementType.CLOSE):
                self.remove_availability(name, week, action.day, action.from_time, action.to_time)
    
    @classmethod
    def from_grid(cls, grid):
        '''Create a TimeGrid directly from the grid'''
        new_grid = cls(date.today(), date.today())
        new_grid.grid = grid
        return new_grid


def format_time_grid(time_grid):
    '''Creates a JSON formatted version of the time grid'''
    return {
        to_iso_no_hyphens(dt): slots
        for dt, slots in time_grid.grid.items()
    }


def parse_time_grid(time_grid_json):
    '''Parse a JSON formatted version of the time grid'''
    return TimeGrid.from_grid({
        from_iso_no_hyphens(dt): slots
        for dt, slots in time_grid_json.items()
    })
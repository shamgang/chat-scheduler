from enum import Enum
from datetime import datetime, time
import calendar
import numpy as np
from .system_prompts import hours_system_prompt
from .model_tools import _day_of_week_from_str
from .chain_helpers import create_chain, invoke_chain


class TimeRange:
    def __init__(self, start_time, end_time):
        self.start_time = start_time
        self.end_time = end_time

    def __str__(self):
        return f"{self.start_time.strftime('%H%M')}-{self.end_time.strftime('%H%M')}"

    def __repr__(self):
        return self.__str__()


class HourStatementType(str, Enum):
    OPEN = "OPEN"
    CLOSE = "CLOSE"


def from_time_string(time_str):
    return datetime.strptime(time_str, '%I%M%p').time()


day_inds = { calendar.day_name[i]: i for i in range(7) }


SLOTS_PER_DAY = 48
SLOTS_PER_HOUR = SLOTS_PER_DAY / 24
MINUTES_PER_SLOT = 60 / SLOTS_PER_HOUR


class CalendarAction:
    '''An OPEN or CLOSE action on a day and time range'''
    def __init__(self, statement_str):
        self.type = HourStatementType[statement_str.split(':')[0]]
        self.day = _day_of_week_from_str(statement_str.split(':')[1])
        tr_str = statement_str.split(':')[2]
        self.time_range = TimeRange(
            from_time_string(tr_str.split('-')[0]), 
            from_time_string(tr_str.split('-')[1]),
        )

    def __str__(self):
        return f"{self.type}:{calendar.day_name[self.day]}:{self.time_range.start_time.strftime('%I%p')}-{self.time_range.end_time.strftime('%I%p')}"

    def __repr__(self):
        return self.__str__()


class HourTranslator:
    def __init__(self, model):
        self.model = model
    
    def translate_to_calendar_actions(self, input):
        '''Given an description of availability, convert to a series of CalendarActions'''
        hours_chain = create_chain(self.model, hours_system_prompt)
        statements = invoke_chain(hours_chain, input)
        statement_lines = statements.splitlines()
        return [CalendarAction(s) for s in statement_lines]


class WeeklyTimeGrid:
    '''A representation of a weekly calendar with a certain slot size'''
    def __init__(self):
        # Half-hour granularity
        self.grid = np.zeros((SLOTS_PER_DAY, 7))

    def _get_num_slots(self, time):
        last_hour_slots = round(time.minute / MINUTES_PER_SLOT)
        return int(time.hour * SLOTS_PER_HOUR + last_hour_slots)
    
    def _set(self, day_ind, time_range, val):
        '''Given a day index and a time range on that day, mark the grid with an integer value 0 or 1 during that range.'''
        col = day_ind
        row_start = self._get_num_slots(time_range.start_time)
        row_end = self._get_num_slots(time_range.end_time)
        if row_end == 0:
            row_end = SLOTS_PER_DAY
        self.grid[row_start:row_end, col] = val

    def process_calendar_action(self, action):
        # 1 for open, 0 for closed
        self._set(action.day, action.time_range, 1 if action.type == HourStatementType.OPEN else 0)

    def process_calendar_actions(self, actions):
        for action in actions:
            self.process_calendar_action(action)

    def _get_time_from_slot(self, slot_num):
        return time(
            int(slot_num // SLOTS_PER_HOUR),
            int((slot_num % SLOTS_PER_HOUR) * MINUTES_PER_SLOT)
        )
    
    def get_time_ranges(self):
        ranges = [[], [], [], [], [], [], []] # list of ranges per day of week
        start = None
        for day in range(7):
            for slot in range(SLOTS_PER_DAY):
                slot_value = self.grid[slot, day]
                if slot_value == 1:
                    # Open slot
                    if start is None:
                        # Found a new open range
                        start = self._get_time_from_slot(slot)
                elif slot_value == 0:
                    # Closed slot
                    if start is not None:
                        # Reached the end of an open range
                        ranges[day].append(TimeRange(start, self._get_time_from_slot(slot)))
                        start = None
            if start is not None:
                # Reached the end of the day with an open time range
                ranges[day].append(TimeRange(start, time(0, 0)))
                start = None
        return ranges
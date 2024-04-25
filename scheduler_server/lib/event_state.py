from .logger import logger
from .time_grid import TimeGrid
from .json_helpers import format_time_grid, state_validator, validate_verbose
from .model_tools import to_iso_no_hyphens


class EventState:
    def __init__(self, from_date, to_date):
        self.from_date = from_date
        self.to_date = to_date
        self.general_avail_confirmed = {}
        self.time_grid = TimeGrid(from_date, to_date)
        self.names = []
    
    def get_general_avail_confirmed(self, name):
        if name not in self.general_avail_confirmed:
            self.general_avail_confirmed[name] = False
        return self.general_avail_confirmed[name]
    
    def set_general_avail_confirmed(self, name, val):
        self.general_avail_confirmed[name] = val

    def add_name(self, name):
        if name not in self.names:
            self.names.append(name)


# TODO: real persistence method
events = {}


def create_event(event_id, from_date, to_date):
    '''Gets or creates event state by ID'''
    if event_id in events:
        raise KeyError('Trying to create an event that already exists')
    events[event_id] = EventState(from_date, to_date)
    logger.debug(f'Created new event: {event_id}')
    return events[event_id]


def get_event(event_id):
    return events[event_id]


def format_event_state(event_state):
    result = {
        'fromDate': to_iso_no_hyphens(event_state.from_date),
        'toDate': to_iso_no_hyphens(event_state.to_date),
        'generalAvailConfirmed': event_state.general_avail_confirmed,
        'timeGrid': format_time_grid(event_state.time_grid),
        'names': event_state.names
    }
    validate_verbose(state_validator, result)
    return result

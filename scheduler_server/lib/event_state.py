from .logger import logger
from .hour_translation import WeeklyTimeGrid
from .datetime_helpers import GENERAL_WEEK_KEY
from .json_helpers import format_time_ranges, state_validator, validate_verbose
from .model_tools import to_iso_no_hyphens


class EventState:
    def __init__(self):
        self.chosen_dates = None # TODO: validation / type hint
        self.general_avail_confirmed = False
        self.time_grids = { 
            GENERAL_WEEK_KEY: WeeklyTimeGrid()
        }

    def get_time_grid(self, week):
        if week not in self.time_grids:
            # Creating specific availability, copy general availability and edit
            self.time_grids[week] = WeeklyTimeGrid.clone(
                self.time_grids[GENERAL_WEEK_KEY]
            )
        return self.time_grids[week]


# TODO: real persistence method
events = {}


def get_or_create_event(event_id):
    '''Gets or creates event state by ID'''
    if event_id not in events:
        logger.debug(f'Creating new event: {event_id}')
        events[event_id] = EventState()
    return events[event_id]


def get_event(event_id):
    return events[event_id]


def format_event_state(event_state):
    result = {
        'chosenDates': {
            'from': to_iso_no_hyphens(event_state.chosen_dates['from']),
            'to': to_iso_no_hyphens(event_state.chosen_dates['to']),
        } if event_state.chosen_dates else None,
        'generalAvailConfirmed': event_state.general_avail_confirmed,
        'timeRanges': {
            key: format_time_ranges(grid.get_time_ranges())
            for key, grid in event_state.time_grids.items()
        }
    }
    validate_verbose(state_validator, result)
    return result

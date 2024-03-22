from uuid import uuid4
import chainlit as cl
from .logger import logger
from .hour_translation import WeeklyTimeGrid
from .datetime_helpers import GENERAL_WEEK_KEY


class SessionState:
    def __init__(self):
        self.chosen_dates = None # TODO: validation / type hint
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
sessions = {}


CL_SESSION_ID_KEY = 'session_id'


def create_session():
    session_id = uuid4()
    logger.debug(f'New session: {session_id}')
    cl.user_session.set(CL_SESSION_ID_KEY, session_id)
    session_state = SessionState()
    sessions[session_id] = session_state
    return session_state


def get_session(session_id=None):
    '''Gets the current session state, or look up by ID'''
    if session_id == None:
        session_id = cl.user_session.get(CL_SESSION_ID_KEY)
    return sessions[session_id]

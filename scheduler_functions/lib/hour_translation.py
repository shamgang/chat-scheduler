from enum import Enum
import calendar

from .system_prompts import hours_system_prompt
from .model_tools import _day_of_week_from_str
from .chain_helpers import create_chain, invoke_chain
from .errors import ErrorType, TranslationFailedError
from .logger import logger
from .datetime_helpers import from_time_string_12


class HourStatementType(str, Enum):
    OPEN = "OPEN"
    CLOSE = "CLOSE"


class CalendarAction:
    '''An OPEN or CLOSE action on a day and time range'''
    def __init__(self, statement_str):
        try:
            self.type = HourStatementType[statement_str.split(':')[0]]
            self.day = _day_of_week_from_str(statement_str.split(':')[1])
            tr_str = statement_str.split(':')[2]
            self.from_time = from_time_string_12(tr_str.split('-')[0])
            self.to_time = from_time_string_12(tr_str.split('-')[1])
        except KeyError:
            err = f'String {statement_str} could not be parsed as an availability statement.'
            logger.info(err)
            raise TranslationFailedError(err, ErrorType.INVALID_AVAILABILITY)

    def __str__(self):
        return f"{self.type}:{calendar.day_name[self.day]}:{self.from_time.strftime('%I%p')}-{self.to_time.strftime('%I%p')}"

    def __repr__(self):
        return self.__str__()


class HourTranslator:
    def __init__(self, model):
        self.model = model
    
    def translate_to_calendar_actions(self, input):
        '''Given a description of availability, convert to a series of CalendarActions'''
        hours_chain = create_chain(self.model, hours_system_prompt)
        statements = invoke_chain(hours_chain, input)
        statement_lines = statements.splitlines()
        return [CalendarAction(s) for s in statement_lines]

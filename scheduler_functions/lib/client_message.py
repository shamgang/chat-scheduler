from enum import Enum
import json
from .model_tools import from_iso_no_hyphens, to_iso_no_hyphens
from .datetime_helpers import (
    datetime_from_iso_no_hyphens,
    parse_week,
    from_time_string_24
)
from .json_helpers import (
    get_message_validator,
    validate_verbose
)
from .time_grid import format_time_grid


class ClientMessageType(str, Enum):
    DATES = 'DATES'
    RANGE = 'RANGE'
    MEETING_TITLE = 'MEETING_TITLE'
    NAME = 'NAME'
    TIMES = 'TIMES'
    TIME_GRID = 'TIME_GRID'
    CONFIRM = 'CONFIRM'
    TOGGLE_SLOTS = 'TOGGLE_SLOTS'
    TOGGLE_GENERAL_SLOTS = 'TOGGLE_GENERAL_SLOTS'
    ERROR = 'ERROR'


class Author(str, Enum):
    USER = 'USER'
    SCHEDULER = 'SCHEDULER'


class UpdateType(str, Enum):
    PROMPT = 'PROMPT'
    MANUAL = 'MANUAL'


def parse_message(msg_str):
    '''Convert client messages from json message to internal format'''
    msg = json.loads(msg_str)
    validate_verbose(get_message_validator(), msg)
    msg_type = msg['type']
    from_date, to_date, week, from_time, to_time = (None, None, None, None, None)
    if msg_type == ClientMessageType.RANGE:
        from_date = from_iso_no_hyphens(msg['fromDate'])
        to_date = from_iso_no_hyphens(msg['toDate'])
    if msg_type == ClientMessageType.TIMES:
        week = parse_week(msg['week'])
    if msg_type == ClientMessageType.TOGGLE_SLOTS:
        from_time = datetime_from_iso_no_hyphens(msg['from'])
        to_time = datetime_from_iso_no_hyphens(msg['to'])
    if msg_type == ClientMessageType.TOGGLE_GENERAL_SLOTS:
        from_time = from_time_string_24(msg['from'])
        to_time = from_time_string_24(msg['to'])
    return ClientMessage(
        type=msg_type,
        author=msg['author'],
        prompt=msg.get('prompt'),
        from_date=from_date,
        to_date=to_date,
        week=week,
        time_grid=None,
        day=msg.get('day'),
        from_time=from_time,
        to_time=to_time,
        error_message=None,
        event_id=msg.get('eventId'),
        title=msg.get('title'),
        name=msg.get('name')
    )


def format_message(msg):
    '''Convert scheduler message from internal format to json message'''
    msg_json = {
        'type': msg.type,
        'author': msg.author
    }
    if msg.type == ClientMessageType.RANGE:
        msg_json['fromDate'] = to_iso_no_hyphens(msg.from_date)
        msg_json['toDate'] = to_iso_no_hyphens(msg.to_date)
    if msg.type == ClientMessageType.TIME_GRID:
        msg_json['timeGrid'] = format_time_grid(msg.time_grid)
        msg_json['updateType'] = msg.update_type
    if msg.error_message:
        msg_json['errorMessage'] = msg.error_message
    if msg.error_type:
        msg_json['errorType'] = msg.error_type
    if msg.event_id:
        msg_json['eventId'] = msg.event_id
    if msg.name:
        msg_json['name'] = msg.name
    validate_verbose(get_message_validator(), msg_json)
    return msg_json


class ClientMessage:
    '''Messages going to or from the client, internal format'''
    def __init__(
        self,
        type,
        author,
        prompt=None,
        from_date=None,
        to_date=None,
        week=None,
        time_grid=None,
        update_type=None,
        day=None,
        from_time=None,
        to_time=None,
        error_message=None,
        error_type=None,
        event_id=None,
        title=None,
        name=None
    ):
        self.type = type
        self.author = author
        self.prompt = prompt
        self.from_date = from_date
        self.to_date = to_date
        self.week = week
        self.time_grid = time_grid
        self.update_type = update_type
        self.day = day
        self.from_time = from_time
        self.to_time = to_time
        self.error_message = error_message
        self.error_type = error_type
        self.event_id = event_id
        self.title = title
        self.name = name
    
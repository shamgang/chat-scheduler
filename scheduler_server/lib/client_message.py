from enum import Enum
import chainlit as cl
import json
from .model_tools import from_iso_no_hyphens, to_iso_no_hyphens
from .datetime_helpers import (
    datetime_from_iso_no_hyphens,
    parse_week
)
from .json_helpers import (
    format_time_grid,
    message_validator,
    validate_verbose
)


class ClientMessageType(str, Enum):
    DATES = 'DATES'
    RANGE = 'RANGE'
    NAME = 'NAME'
    TIMES = 'TIMES'
    TIME_GRID = 'TIME_GRID'
    CONFIRM = 'CONFIRM'
    TOGGLE_SLOTS = 'TOGGLE_SLOTS'
    ERROR = 'ERROR'


class Author(str, Enum):
    USER = 'USER'
    SCHEDULER = 'SCHEDULER'


def parse_message(msg_str):
    '''Convert client messages from json message to internal format'''
    msg = json.loads(msg_str)
    validate_verbose(message_validator, msg)
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
    return ClientMessage(
        type=msg_type,
        author=msg['author'],
        prompt=msg.get('prompt'),
        from_date=from_date,
        to_date=to_date,
        week=week,
        time_grid=None,
        from_time=from_time,
        to_time=to_time,
        error_message=None,
        event_id=msg.get('eventId'),
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
    if msg.error_message:
        msg_json['errorMessage'] = msg.error_message
    if msg.event_id:
        msg_json['eventId'] = msg.event_id
    if msg.name:
        msg_json['name'] = msg.name
    validate_verbose(message_validator, msg_json)
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
        from_time=None,
        to_time=None,
        error_message=None,
        event_id=None,
        name=None
    ):
        self.type = type
        self.author = author
        self.prompt = prompt
        self.from_date = from_date
        self.to_date = to_date
        self.week = week
        self.time_grid = time_grid
        self.from_time = from_time
        self.to_time = to_time
        self.error_message = error_message
        self.event_id = event_id
        self.name = name
            
    def format_message(self):
        '''To chainlit format'''
        return cl.Message(
            author=self.author,
            content=format_message(self)
        )
    
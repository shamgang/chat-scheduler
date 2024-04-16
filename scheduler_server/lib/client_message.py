from enum import Enum
import chainlit as cl
import json
from .model_tools import from_iso_no_hyphens, to_iso_no_hyphens
from .datetime_helpers import (
    datetime_from_iso_no_hyphens,
    datetime_to_iso_no_hyphens,
    format_week,
    parse_week
)
from .json_helpers import (
    parse_time_ranges,
    format_time_ranges,
    message_validator,
    validate_verbose,
    parse_found_times,
    format_found_times
)


class ClientMessageType(str, Enum):
    DATES = 'DATES'
    RANGE = 'RANGE'
    NAME = 'NAME'
    TIMES = 'TIMES'
    TIME_RANGES = 'TIME_RANGES' # TODO: refactor all of these to be clearer
    CONFIRM = 'CONFIRM'
    OPEN = 'OPEN'
    CLOSE = 'CLOSE'
    FIND_TIMES = 'FIND_TIMES'
    FOUND_TIMES = 'FOUND_TIMES'
    ERROR = 'ERROR'


class Author(str, Enum):
    USER = 'USER'
    SCHEDULER = 'SCHEDULER'


def parse_message(msg_str):
    '''Convert from json message to internal format'''
    msg = json.loads(msg_str)
    validate_verbose(message_validator, msg)
    msg_type = msg['type']
    from_date, to_date, week, time_ranges, from_time, to_time, found_times = (None, None, None, None, None, None, None)
    if msg_type == ClientMessageType.RANGE:
        from_date = from_iso_no_hyphens(msg['fromDate'])
        to_date = from_iso_no_hyphens(msg['toDate'])
    if msg_type == ClientMessageType.TIMES:
        week = parse_week(msg['week'])
    if msg_type == ClientMessageType.TIME_RANGES:
        week = parse_week(msg['week'])
        time_ranges = parse_time_ranges(msg['timeRanges'])
    if msg_type in [ClientMessageType.OPEN, ClientMessageType.CLOSE]:
        from_time = datetime_from_iso_no_hyphens(msg['from'])
        to_time = datetime_from_iso_no_hyphens(msg['to'])
    if msg_type == ClientMessageType.FOUND_TIMES:
        found_times = parse_found_times(msg['foundTimes'])
    return ClientMessage(
        type=msg_type,
        author=msg['author'],
        prompt=msg.get('prompt'),
        from_date=from_date,
        to_date=to_date,
        week=week,
        time_ranges=time_ranges,
        from_time=from_time,
        to_time=to_time,
        error_message=msg.get('errorMessage'),
        event_id=msg.get('eventId'),
        name=msg.get('name'),
        found_times=found_times
    )


def format_message(msg):
    '''Convert from internal format to json message'''
    msg_json = {
        'type': msg.type,
        'author': msg.author
    }
    if msg.type == ClientMessageType.RANGE:
        msg_json['fromDate'] = to_iso_no_hyphens(msg.from_date)
        msg_json['toDate'] = to_iso_no_hyphens(msg.to_date)
    if msg.type == ClientMessageType.TIMES:
        msg_json['week'] = format_week(msg.week)
    if msg.type == ClientMessageType.TIME_RANGES:
        msg_json['week'] = format_week(msg.week)
        msg_json['timeRanges'] = format_time_ranges(msg.time_ranges)
    if msg.type in [ClientMessageType.OPEN, ClientMessageType.CLOSE]:
        msg_json['from'] = datetime_to_iso_no_hyphens(msg.from_time)
        msg_json['to'] = datetime_to_iso_no_hyphens(msg.to_time)
    if msg.type == ClientMessageType.FOUND_TIMES:
        msg_json['foundTimes'] = format_found_times(msg.found_times)
        print(msg_json)
    if msg.prompt:
        msg_json['prompt'] = msg.prompt
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
        time_ranges=None,
        from_time=None,
        to_time=None,
        error_message=None,
        event_id=None,
        name=None,
        found_times=None
    ):
        self.type = type
        self.author = author
        self.prompt = prompt
        self.from_date = from_date
        self.to_date = to_date
        self.week = week
        self.time_ranges = time_ranges
        self.from_time = from_time
        self.to_time = to_time
        self.error_message = error_message
        self.event_id = event_id
        self.name = name
        self.found_times = found_times
            
    def format_message(self):
        '''To chainlit format'''
        return cl.Message(
            author=self.author,
            content=format_message(self)
        )
    
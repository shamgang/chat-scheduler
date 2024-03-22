from enum import Enum
import chainlit as cl
from datetime import datetime
import json
import jsonschema
import os.path
from lib.model_tools import from_iso_no_hyphens, to_iso_no_hyphens
from lib.datetime_helpers import (
    TimeRange,
    from_time_string,
    to_time_string,
    datetime_from_iso_no_hyphens,
    datetime_to_iso_no_hyphens,
    format_week,
    parse_week,
    GENERAL_WEEK_KEY
)


MESSAGE_SCHEMA_PATH = os.path.join(
    os.path.dirname(__file__),
    '../../assets/message_schema.json'
)
with open(MESSAGE_SCHEMA_PATH, 'r') as schema_file:
    schema = json.load(schema_file)
validator = jsonschema.Draft7Validator(schema)


class ClientMessageType(str, Enum):
    DATES = 'DATES'
    RANGE = 'RANGE'
    TIMES = 'TIMES'
    TIME_RANGES = 'TIME_RANGES' # TODO: refactor all of these to be clearer
    CONFIRM = 'CONFIRM'
    OPEN = 'OPEN'
    CLOSE = 'CLOSE'
    ERROR = 'ERROR'


class Author(str, Enum):
    USER = 'USER'
    SCHEDULER = 'SCHEDULER'


def parse_message(msg_str):
    '''Convert from json message to internal format'''
    msg = json.loads(msg_str)
    validator.validate(msg)
    msg_type = msg['type']
    from_date, to_date, week, time_ranges, from_time, to_time = (None, None, None, None, None, None)
    if msg_type == ClientMessageType.RANGE:
        from_date = from_iso_no_hyphens(msg['fromDate'])
        to_date = from_iso_no_hyphens(msg['toDate'])
    if msg_type == ClientMessageType.TIMES:
        week = parse_week(msg['week'])
    if msg_type == ClientMessageType.TIME_RANGES:
        week = parse_week(msg['week'])
        time_ranges = msg['timeRanges']
        for day in time_ranges:
            for i, time_range in enumerate(day):
                day[i] = TimeRange(
                    from_time_string(time_range['from']),
                    from_time_string(time_range['to'])
                )
    if msg_type in [ClientMessageType.OPEN, ClientMessageType.CLOSE]:
        from_time = datetime_from_iso_no_hyphens(msg['from'])
        to_time = datetime_from_iso_no_hyphens(msg['to'])
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
        error_message=msg.get('error_message')
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
        for day in msg.time_ranges:
            for i, time_range in enumerate(day):
                day[i] = {
                    'from': to_time_string(time_range.start_time),
                    'to': to_time_string(time_range.end_time)
                }
        msg_json['timeRanges'] = msg.time_ranges
    if msg.type in [ClientMessageType.OPEN, ClientMessageType.CLOSE]:
        msg_json['from'] = datetime_to_iso_no_hyphens(msg.from_time)
        msg_json['to'] = datetime_to_iso_no_hyphens(msg.to_time)
    if msg.prompt:
        msg_json['prompt'] = msg.prompt
    if msg.error_message:
        msg_json['errorMessage'] = msg.error_message
    validator.validate(msg_json)
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
        error_message=None
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
            
    def format_message(self):
        '''To chainlit format'''
        return cl.Message(
            author=self.author,
            content=format_message(self)
        )
    
from enum import Enum
import chainlit as cl
from lib.model_tools import to_range_str, from_range_str


class ClientMessageType(str, Enum):
    DATES = 'DATES'
    RANGE = 'RANGE'
    TIMES = 'TIMES'
    TIME_RANGES = 'TIME_RANGES' # TODO: refactor all of these to be clearer
    CONFIRM = 'CONFIRM'
    ERROR = 'ERROR'


class Author(str, Enum):
    USER = 'USER'
    SCHEDULER = 'SCHEDULER'


def get_message_type(message_content):
    return ClientMessageType[message_content.split(':')[0]]


def remove_message_type(message_content):
    return message_content[message_content.index(':')+1:]


def add_message_type(content, type):
    return f'{type}:{content}'


def to_time_ranges_str(time_ranges):
    print(time_ranges)
    return '\n'.join([
        ','.join([str(time_range) for time_range in day])
        if len(day) > 0
        else ''
        for day in time_ranges
    ])


def parse_message(msg, author=Author.USER):
    '''Convert from chainlit incoming message format to internal format'''
    type = get_message_type(msg.content)
    text = remove_message_type(msg.content)
    if type == ClientMessageType.RANGE:
        from_date, to_date = from_range_str(text)
    else:
        from_date, to_date = (None, None)
    if type == ClientMessageType.TIMES:
        week = text[0:text.index(':')]
        times_prompt = text[text.index(':')+1:]
    else:
        week, times_prompt = (None, None)
    return ClientMessage(
        type,
        author,
        text,
        from_date=from_date,
        to_date=to_date,
        week=week,
        times_prompt=times_prompt
    )


class ClientMessage:
    '''Messages going to or from the client, internal format'''
    def __init__(self, type, author, text=None, from_date=None, to_date=None, time_ranges=None, week=None, times_prompt=None):
        self.type = type
        self.author = author
        self.text = text
        if self.type == ClientMessageType.RANGE:
            self.from_date = from_date
            self.to_date = to_date
            self.text = to_range_str(from_date, to_date)
        elif self.type == ClientMessageType.TIME_RANGES:
            self.time_ranges = time_ranges
            self.text = to_time_ranges_str(time_ranges)
        elif self.type == ClientMessageType.TIMES:
            self.week = week
            self.times_prompt = times_prompt
            self.text = week + ':' + times_prompt
        if self.text is None:
            raise ValueError('text must not be None')
            
            
    def format_message(self):
        '''To chainlit format'''
        return cl.Message(
            author=self.author,
            content=add_message_type(self.text, self.type)
        )
    
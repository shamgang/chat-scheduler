import json
import traceback
from os import getenv
from langchain_openai import ChatOpenAI
from ..lib.logger import logger
from ..lib.date_translation import DateTranslator
from ..lib.hour_translation import HourTranslator
from ..lib.errors import TranslationFailedError, InvalidPromptError
from ..lib.event_state import create_event, get_event, update_event
from ..lib.logger import logger
from ..lib.client_message import (
    ClientMessage,
    parse_message,
    format_message,
    ClientMessageType,
    Author,
    UpdateType
)

# Cheaper, workhorse model
model = ChatOpenAI(model=getenv('PRIMARY_MODEL'), temperature=0)
date_translator = DateTranslator(model)
hour_translator = HourTranslator(model)
# More expensive model for escalating difficult tasks
backup_model = None
backup_date_translator = None
backup_hour_translator = None
if getenv('SECONDARY_MODEL'):
    backup_model = ChatOpenAI(model=getenv('SECONDARY_MODEL'), temperature=0)
    backup_date_translator = DateTranslator(backup_model)
    backup_hour_translator = HourTranslator(backup_model)

from azure.functions import Out # type: ignore

def message_handler(msg):
    '''
    Arguments:
        ClientMessage
    Returns:
        response: ClientMessage or None: response to send
        send_to_event: String or None: event id to send response to
        subscribe_to_event: String or None: event id to subscribe connection to
    Can raise exceptions'''
    response = None
    send_to_event = None
    subscribe_to_event = None
    if msg.type == ClientMessageType.DATES:
        # User is defining a date range
        try:
            start_date, end_date = date_translator.translate_to_date_range(msg.prompt)
        except TranslationFailedError as tfe:
            if not backup_model:
                raise tfe
            trace = traceback.format_exc()
            logger.error(f'Translation error: {trace}')
            logger.info('Retrying translation with better model.')
            start_date, end_date = backup_date_translator.translate_to_date_range(msg.prompt)
        response = ClientMessage(
            type=ClientMessageType.RANGE,
            author=Author.SCHEDULER,
            from_date=start_date,
            to_date=end_date
        )
    elif msg.type == ClientMessageType.RANGE:
        # User has confirmed date range
        create_event(msg.event_id, msg.from_date, msg.to_date)
    elif msg.type == ClientMessageType.MEETING_TITLE:
        event = get_event(msg.event_id)
        event.set_title(msg.title)
        update_event(msg.event_id, event)
    elif msg.type == ClientMessageType.NAME:
        event = get_event(msg.event_id)
        event.add_name(msg.name)
        update_event(msg.event_id, event)
        subscribe_to_event = msg.event_id
    elif msg.type == ClientMessageType.TIMES:
        # User is defining time slots
        try:
            calendar_actions = hour_translator.translate_to_calendar_actions(msg.prompt)
        except TranslationFailedError as tfe:
            if not backup_model:
                raise tfe
            trace = traceback.format_exc()
            logger.error(f'Translation error: {trace}')
            logger.info('Retrying translation with better model.')
            calendar_actions = backup_hour_translator.translate_to_calendar_actions(msg.prompt)
        event = get_event(msg.event_id)
        time_grid = event.time_grid
        time_grid.process_calendar_actions(msg.name, msg.week, calendar_actions)
        update_event(msg.event_id, event)
        response = ClientMessage(
            type=ClientMessageType.TIME_GRID,
            author=Author.SCHEDULER,
            time_grid=time_grid,
            names=event.names,
            update_type=UpdateType.PROMPT,
            name=msg.name
        )
        send_to_event = msg.event_id
    elif msg.type == ClientMessageType.CONFIRM:
        # User has confirmed general avail
        event = get_event(msg.event_id)
        event.set_general_avail_confirmed(msg.name, True)
        update_event(msg.event_id, event)
    elif msg.type == ClientMessageType.TOGGLE_SLOTS:
        event = get_event(msg.event_id)
        time_grid = event.time_grid
        time_grid.toggle_availability(
            msg.name,
            msg.from_time.date(),
            msg.from_time.time(),
            msg.to_time.time()
        )
        update_event(msg.event_id, event)
        response = ClientMessage(
            type=ClientMessageType.TIME_GRID,
            author=Author.SCHEDULER,
            time_grid=time_grid,
            names=event.names,
            update_type=UpdateType.MANUAL,
            name=msg.name
        )
        send_to_event = msg.event_id
    elif msg.type == ClientMessageType.TOGGLE_GENERAL_SLOTS:
        event = get_event(msg.event_id)
        time_grid = event.time_grid
        time_grid.toggle_general_availability(
            msg.name,
            msg.day,
            msg.from_time,
            msg.to_time
        )
        update_event(msg.event_id, event)
        response = ClientMessage(
            type=ClientMessageType.TIME_GRID,
            author=Author.SCHEDULER,
            time_grid=time_grid,
            names=event.names,
            update_type=UpdateType.MANUAL,
            name=msg.name
        )
        send_to_event = msg.event_id
    return response, send_to_event, subscribe_to_event


def main(request, actions: Out[str]) -> None:
    connection_id = None
    group_id = None
    try:
        request_json = json.loads(request)
        origin = request_json['connectionContext']['origin']
        connection_id = request_json['connectionContext']['connectionId']
        logger.info(f'Message handler invoked with origin: {origin} and connection id {connection_id}')
        msg_str = json.loads(request)['data']
        logger.debug(f'Incoming message: {msg_str}')
        msg = parse_message(msg_str)
        response, send_to_event, subscribe_to_event = message_handler(msg)
        if send_to_event:
            group_id = send_to_event
        if subscribe_to_event:
            logger.debug(f'Subscribe {connection_id} to event: {subscribe_to_event}')
            actions.set(json.dumps({
                "actionName": "addConnectionToGroup",
                "connectionId": connection_id,
                "group": subscribe_to_event
            }))
    except (TranslationFailedError, InvalidPromptError) as tfe:
        # Known error
        logger.error(f'Translation failed: {str(tfe)}')
        response = ClientMessage(
            type=ClientMessageType.ERROR,
            author=Author.SCHEDULER,
            error_message=str(tfe),
            error_type=tfe.type
        )
    except Exception as e:
        # Unknown error
        trace = traceback.format_exc()
        logger.error(f'Unexpected error: {trace}')
        # TODO: returning arbitary trace data would be a potential vulnerability
        # if this application had any private data.
        # For now, it may be useful for debugging.
        response = ClientMessage(
            type=ClientMessageType.ERROR,
            author=Author.SCHEDULER,
            error_message=trace
        )
    if response and connection_id:
        try:
            response_json = format_message(response)
            response_str = json.dumps(response_json)
            response_summary = response_str[:200] + ("..." if len(response_str) > 200 else "")
            logger.debug(f'Response: {response_summary}')
            logger.debug(f'Group id: {group_id}')
            if group_id:
                actions.set(json.dumps({
                    "actionName": "sendToGroup",
                    "group": group_id,
                    "data": response_str,
                    "dataType": 'json',
                }))
            else:
                actions.set(json.dumps({
                    "actionName": "sendToConnection",
                    "connectionId": connection_id,
                    "data": response_str,
                    "dataType": 'json',
                }))
        except Exception as e:
            logger.error(f'Failed to send response: {traceback.format_exc}')
import json
from langchain_openai import ChatOpenAI
from ..lib.logger import logger
from ..lib.date_translation import DateTranslator
from ..lib.hour_translation import HourTranslator
from ..lib.errors import TranslationFailedError
from ..lib.event_state import create_event, get_event, update_event
from ..lib.logger import logger
from ..lib.client_message import (
    ClientMessage,
    parse_message,
    format_message,
    ClientMessageType,
    Author
)

model = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
date_translator = DateTranslator(model)
hour_translator = HourTranslator(model)

from azure.functions import Out

def main(request, actions: Out[str]) -> None:
    # TODO: top level error handling?
    msg_str = json.loads(request)['data']
    logger.debug(f'Incoming message: {msg_str}')
    msg = parse_message(msg_str)
    response = None
    if msg.type == ClientMessageType.DATES:
        # User is defining a date range
        try:
            start_date, end_date = date_translator.translate_to_date_range(msg.prompt)
            response = ClientMessage(
                type=ClientMessageType.RANGE,
                author=Author.SCHEDULER,
                from_date=start_date,
                to_date=end_date
            )
        except TranslationFailedError as tfe:
            response = ClientMessage(
                type=ClientMessageType.ERROR,
                author=Author.SCHEDULER,
                error_message=str(tfe)
            )
        except Exception as e:
            logger.error(e)
            response = ClientMessage(
                type=ClientMessageType.ERROR,
                author=Author.SCHEDULER,
                error_message='An unknown error occured.'
            ) # TODO: bug reporting
    elif msg.type == ClientMessageType.RANGE:
        # User has confirmed date range
        # TODO: return this new event so it can be loaded immediately
        create_event(msg.event_id, msg.from_date, msg.to_date)
    elif msg.type == ClientMessageType.NAME:
        event = get_event(msg.event_id)
        event.add_name(msg.name)
        update_event(msg.event_id, event)
    elif msg.type == ClientMessageType.TIMES:
        # User is defining time slots
        try:
            calendar_actions = hour_translator.translate_to_calendar_actions(msg.prompt)
            event = get_event(msg.event_id)
            time_grid = event.time_grid
            time_grid.process_calendar_actions(msg.name, msg.week, calendar_actions)
            update_event(msg.event_id, event)
            response = ClientMessage(
                type=ClientMessageType.TIME_GRID,
                author=Author.SCHEDULER,
                time_grid=time_grid
            )
        except TranslationFailedError as tfe:
            response = ClientMessage(
                type=ClientMessageType.ERROR,
                author=Author.SCHEDULER,
                error_message=str(tfe)
            )
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
            time_grid=time_grid
        )
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
            time_grid=time_grid
        )
    if response:
        response_json = format_message(response)
        response_str = json.dumps(response_json)
        response_summary = response_str[:200] + ("..." if len(response_str) > 200 else "")
        logger.debug(f'Response: {response_summary}')
        actions.set(json.dumps({
            "actionName": "sendToAll",
            "data": response_str,
            "dataType": 'json',
        }))

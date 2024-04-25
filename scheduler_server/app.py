from fastapi import Request
import chainlit as cl
from chainlit.server import app
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from lib.date_translation import DateTranslator
from lib.hour_translation import HourTranslator
from lib.errors import TranslationFailedError
from lib.event_state import create_event, get_event, format_event_state
from lib.logger import logger
from lib.client_message import (
    ClientMessage,
    parse_message,
    ClientMessageType,
    Author
)
from lib.datetime_helpers import get_last_monday


# Expect the following keys to exist in .env:
# LANGCHAIN_TRACING_V2
# LANGCHAIN_API_KEY
# OPENAI_API_KEY
load_dotenv('./chainlit-backend/.env')
model = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
date_translator = DateTranslator(model)
hour_translator = HourTranslator(model)


@cl.on_message
async def on_message(message: cl.Message):
    logger.debug(f'Received message: {message.content}')
    msg = parse_message(message.content)
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
        create_event(msg.event_id, msg.from_date, msg.to_date)
    elif msg.type == ClientMessageType.NAME:
        get_event(msg.event_id).add_name(msg.name)
        pass
    elif msg.type == ClientMessageType.TIMES:
        # User is defining time slots
        try:
            actions = hour_translator.translate_to_calendar_actions(msg.prompt)
            time_grid = get_event(msg.event_id).time_grid
            time_grid.process_calendar_actions(msg.name, msg.week, actions)
            response = ClientMessage(
                type=ClientMessageType.TIME_GRID,
                author=Author.SCHEDULER,
                name=msg.name,
                week=msg.week,
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
        get_event(msg.event_id).set_general_avail_confirmed(msg.name, True)
    elif msg.type == ClientMessageType.TOGGLE_SLOTS:
        slot_date = msg.from_time.date()
        monday = get_last_monday(slot_date)
        time_grid = get_event(msg.event_id).time_grid
        time_grid.toggle_availability(
            msg.name,
            monday,
            msg.from_time.weekday(),
            msg.from_time.time(),
            msg.to_time.time()
        )
        response = ClientMessage(
            type=ClientMessageType.TIME_GRID,
            author=Author.SCHEDULER,
            name=msg.name,
            week=monday,
            time_grid=time_grid
        )
    if response:
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content[:200]}{ "..." if len(cl_message.content) > 200 else "" }')
        await cl_message.send()


@app.get("/state/{event_id}")
async def get_state(
    request: Request,
    event_id: str
):
    logger.debug(f'Retrieving event state: {event_id}')
    return format_event_state(get_event(event_id))
    
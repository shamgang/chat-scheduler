from fastapi import Request
import chainlit as cl
from chainlit.server import app
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from datetime import timedelta
from lib.date_translation import DateTranslator
from lib.hour_translation import HourTranslator
from lib.errors import TranslationFailedError
from lib.event_state import get_or_create_event, get_event, format_event_state
from lib.logger import logger
from lib.client_message import (
    ClientMessage,
    parse_message,
    ClientMessageType,
    Author
)
from lib.model_tools import to_iso_no_hyphens


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
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content}')
        await cl_message.send()
    elif msg.type == ClientMessageType.RANGE:
        # User has confirmed date range
        get_or_create_event(msg.event_id).chosen_dates = {
            'from': msg.from_date,
            'to': msg.to_date
        }
    elif msg.type == ClientMessageType.TIMES:
        # User is defining time slots
        actions = hour_translator.translate_to_calendar_actions(msg.prompt)
        grid = get_or_create_event(msg.event_id).get_time_grid(msg.week)
        grid.process_calendar_actions(actions)
        time_ranges = grid.get_time_ranges()
        response = ClientMessage(
            type=ClientMessageType.TIME_RANGES,
            author=Author.SCHEDULER,
            week=msg.week,
            time_ranges=time_ranges
        )
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content}')
        await cl_message.send()
    elif msg.type == ClientMessageType.CONFIRM:
        # User has confirmed general avail
        get_or_create_event(msg.event_id).general_avail_confirmed = True
    elif msg.type == ClientMessageType.OPEN or msg.type == ClientMessageType.CLOSE:
        # Find the right grid or create it
        # TODO: can our date grid be more general-
        # an array of dates instead of an array of weeks
        # with days of the week?
        slot_date = msg.from_time.date()
        monday = slot_date - timedelta(days=slot_date.weekday())
        monday_str = to_iso_no_hyphens(monday)
        time_grid = get_or_create_event(msg.event_id).get_time_grid(monday_str)
        time_grid.process_message(msg)
        response = ClientMessage(
            type=ClientMessageType.TIME_RANGES,
            author=Author.SCHEDULER,
            week=monday,
            time_ranges=time_grid.get_time_ranges()
        )
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content}')
        await cl_message.send()


@app.get("/state/{event_id}")
async def get_state(
    request: Request,
    event_id: str
):
    logger.debug(f'Retrieving event state: {event_id}')
    event_state = format_event_state(get_event(event_id))
    logger.debug(f'State retrieved: {event_state}')
    return event_state
    
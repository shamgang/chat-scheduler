import chainlit as cl
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from datetime import timedelta
from lib.date_translation import DateTranslator
from lib.hour_translation import HourTranslator, WeeklyTimeGrid
from lib.errors import TranslationFailedError
from lib.session_state import create_session, get_session, GENERAL_TIME_GRID_KEY
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
CHATBOT_USERNAME = 'SCHEDULER'


@cl.on_chat_start
async def on_chat_start():
    create_session()


@cl.on_message
async def on_message(message: cl.Message):
    logger.debug(f'Received message: {message.content}')
    msg = parse_message(message)
    session_state = get_session()
    if msg.type == ClientMessageType.DATES:
        # User is defining a date range
        try:
            start_date, end_date = date_translator.translate_to_date_range(msg.text)
            response = ClientMessage(
                ClientMessageType.RANGE,
                Author.SCHEDULER,
                from_date=start_date,
                to_date=end_date
            )
        except TranslationFailedError as tfe:
            response = ClientMessage(
                ClientMessageType.ERROR,
                Author.SCHEDULER,
                str(tfe)
            )
        except Exception as e:
            logger.error(e)
            response = ClientMessage(
                ClientMessageType.ERROR,
                Author.SCHEDULER,
                'An unknown error occured.'
            ) # TODO: bug reporting
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content}')
        await cl_message.send()
    elif msg.type == ClientMessageType.RANGE:
        # User has confirmed date range
        session_state.chosen_dates = [msg.from_date, msg.to_date]
    elif msg.type == ClientMessageType.TIMES:
        # User is defining time slots
        actions = hour_translator.translate_to_calendar_actions(msg.times_prompt)
        grid = session_state.get_time_grid(msg.week)
        grid.process_calendar_actions(actions)
        time_ranges = grid.get_time_ranges()
        response = ClientMessage(
            ClientMessageType.TIME_RANGES,
            Author.SCHEDULER,
            time_ranges=time_ranges
        )
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content}')
        await cl_message.send()
    elif msg.type == ClientMessageType.CONFIRM:
        # User has confirmed general avail
        # TODO: this is not necessary - hack for front end
        # because front end is currently stateless with messages
        # and relies on chainlit for message storage
        # Instead, can sync messages with a queue on the front end
        pass
    elif msg.type == ClientMessageType.OPEN or msg.type == ClientMessageType.CLOSE:
        # Find the right grid or create it
        # TODO: can our date grid be more general-
        # an array of dates instead of an array of weeks
        # with days of the week?
        slot_date = msg.from_date.date()
        monday = to_iso_no_hyphens(slot_date - timedelta(slot_date.weekday()))
        print(monday)
        time_grid = session_state.get_time_grid(monday)
        print(time_grid.grid)
        time_grid.process_message(msg)
        print(time_grid.grid)
        response = ClientMessage(
            ClientMessageType.TIME_RANGES,
            Author.SCHEDULER,
            time_ranges=time_grid.get_time_ranges()
        )
        cl_message = response.format_message()
        logger.debug(f'Model response: {cl_message.content}')
        await cl_message.send()
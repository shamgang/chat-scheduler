from enum import Enum
from .logger import logger
from .chain_helpers import (
    create_chain,
    create_agent,
    invoke_chain
)
from .system_prompts import (
    input_filter_system_prompt,
    date_translation_system_prompt
)
from .model_tools import all_tools, from_iso_no_hyphens
from .config import config
from .errors import ErrorType, TranslationFailedError, InvalidPromptError


class StatementType(str, Enum):
    START = "START"
    END = "END"


def get_statement_types(statements):
    return [s.split(':')[0] for s in statements]


def translate_statement_to_date(statement):
    input = ' '.join(statement.split(' ')[1:])
    try:
        return from_iso_no_hyphens(input)
    except ValueError:
        err = f"Statement '{statement}' could not be translated to a date."
        logger.error(err)
        raise TranslationFailedError(err, ErrorType.DATE_RANGE_TRANSLATION_FAILED)   


class FilterResult(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    MULTIPLE = "MULTIPLE"


class DateTranslator:
    def __init__(self, model):
        self.model = model

    def _filter_input(self, input):
        """Returns the input or throws a TranslationFailedError."""
        input_filter = create_chain(self.model, input_filter_system_prompt)
        filter_result = invoke_chain(input_filter, input)
        logger.debug(f"Input '{input}' filter result: {filter_result}")
        if filter_result == FilterResult.INVALID:
            err = f"Invalid date range: '{input}'"
            logger.info(err)
            raise InvalidPromptError(err, ErrorType.INVALID_DATE_RANGE)
        elif filter_result == FilterResult.MULTIPLE:
            err = f"Input '{input}' contained multiple date ranges."
            logger.warn(err)
            raise InvalidPromptError(err, ErrorType.MULTIPLE_DATE_RANGES)
        elif filter_result == FilterResult.VALID:
            pass
        else:
            err = f"Input '{input}' got unexpected result from input filter: {filter_result}"
            logger.error(err)
            raise TranslationFailedError(err, ErrorType.DATE_RANGE_TRANSLATION_FAILED)
        return input
    
    def _translate_to_date_range(self, input):
        translator = create_agent(self.model, all_tools, date_translation_system_prompt, verbose=config.VERBOSE)
        translater_output = invoke_chain(translator, input)
        logger.debug(f"Input '{input}' generated statements:\n{translater_output}")
        statements = translater_output.splitlines()
        if len(statements) == 1 and statements[0].strip() == 'FAIL':
            err = f"Input '{input}' failed translation."
            logger.error(err)
            raise TranslationFailedError(err, ErrorType.DATE_RANGE_TRANSLATION_FAILED)
        # Look for the wrong number of statements
        if len(statements) != 2:
            err = f"Input '{input}' generated incorrect number of statements: {statements}"
            logger.error(err)
            raise TranslationFailedError(err, ErrorType.DATE_RANGE_TRANSLATION_FAILED)
        # Look for invalid statement types
        statement_types = get_statement_types(statements)
        for st in statement_types:
            if not st in list(StatementType):
                err = f"Input '{input}' generated a statement of unknown type: {st}"
                logger.error(err)
                raise TranslationFailedError(err, ErrorType.DATE_RANGE_TRANSLATION_FAILED)
        # Look for duplicate statements - all should be unique
        if len(set(statement_types)) != len(statement_types):
            err = f"Input '{input}' generated duplicate statements."
            logger.error(err)
            raise TranslationFailedError(err, ErrorType.DATE_RANGE_TRANSLATION_FAILED)
        statement_types = get_statement_types(statements)
        start = translate_statement_to_date(statements[0] if statement_types[0] == StatementType.START else statements[1])
        end = translate_statement_to_date(statements[1] if statement_types[0] == StatementType.START else statements[0])
        return start, end

    def translate_to_date_range(self, input):
        """Given a human description of a date range, return start, end as dates
        May raise various errors
        Raises TranslationFailedError if the translation fails due to uncertainty in the LLM."""
        logger.debug(f'Translating input: {input}')
        logger.debug(f'Step 1: Filtering input {input}')
        filtered_input = self._filter_input(input)
        logger.debug(f'Step 2: Translating input {filtered_input}')
        return self._translate_to_date_range(filtered_input)

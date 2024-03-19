from enum import Enum
from .logger import logger
from .chain_helpers import (
    create_chain,
    create_agent,
    invoke_chain
)
from .system_prompts import (
    input_filter_system_prompt,
    input_to_statements_system_prompt,
    proportion_to_range_system_prompt,
    length_to_range_system_prompt,
    words_to_date_system_prompt
)
from .model_tools import all_tools, from_iso_no_hyphens
from .config import config


class TranslationFailedError(RuntimeError):
    pass


generic_date_parse_failure_message = "Sorry, I had trouble understanding that as a date range. Can you try using more specific language?"


class StatementType(str, Enum):
    START = "START"
    END = "END"
    PROPORTION = "PROPORTION"
    LENGTH = "LENGTH"


def get_statement_types(statements):
    return [s.split(':')[0] for s in statements]


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
            logger.info(f"Invalid date range: '{input}'")
            raise TranslationFailedError(generic_date_parse_failure_message)
        elif filter_result == FilterResult.MULTIPLE:
            logger.info(f"Input '{input}' contained multiple date ranges.")
            raise TranslationFailedError(
                "It looks like you entered multiple date ranges. This tool currently only works with one date range. Sorry! Please enter one date range."
            )
        elif filter_result == FilterResult.VALID:
            pass
        else:
            logger.error(f"Input '{input}' got unexpected result from input filter: {filter_result}")
            raise TranslationFailedError(generic_date_parse_failure_message)
        return input    
    
    def _convert_to_statements(self, input):
        """Converts the input into a series of START, END, PROPORTION, or LENGTH statements."""
        statements_converter = create_chain(self.model, input_to_statements_system_prompt)
        statements_output = invoke_chain(statements_converter, input)
        logger.debug(f"Input '{input}' generated statements:\n{statements_output}")
        statements = statements_output.splitlines()
        # Look for the wrong number of statements
        if len(statements) > 3 or len(statements) < 1:
            logger.error(f"Input '{input}' generated incorrect number of statements: {len(statements)}")
            raise TranslationFailedError(generic_date_parse_failure_message)
        # Look for invalid statement types
        statement_types = get_statement_types(statements)
        for st in statement_types:
            if not st in list(StatementType):
                logger.error(f"Input '{input}' generated a statement of unknown type: {st}")
                raise TranslationFailedError(generic_date_parse_failure_message)
        # Look for duplicate statements - all should be unique
        if len(set(statement_types)) != len(statement_types):
            logger.error(f"Input '{input}' generated duplicate statements.")
            raise TranslationFailedError(generic_date_parse_failure_message)
        # Look for invalid combinations of statements
        if StatementType.PROPORTION in statement_types and len(statements) != 1:
            # We have no logic for handling a PROPORTION statement combined with anything else. Fail.
            logger.error(f"Input '{input}' has a PROPORTION statement along with other statements. This case is undefined.")
            raise TranslationFailedError(generic_date_parse_failure_message)
        if StatementType.PROPORTION not in statement_types and len(statements) < 2:
            # Must have at least two of START, END, and LENGTH
            logger.error(f"Input '{input}' has an invalid combination of statements.")
            raise TranslationFailedError(generic_date_parse_failure_message)
        return statements  
    
    def _translate_proportion(self, statement):
        """Converts a PROPORTION statement into a START and END statement"""
        proportions_translater = create_agent(self.model, all_tools, proportion_to_range_system_prompt, verbose=config.VERBOSE)
        input = ' '.join(statement.split(' ')[1:])
        translater_output = invoke_chain(proportions_translater, input)
        logger.debug(f"Proportion statement '{statement}' generated statements:\n{translater_output}")
        statements = translater_output.splitlines()
        statement_types = get_statement_types(statements)
        if set(statement_types) != set([StatementType.START, StatementType.END]):
            logger.error(f"Proportion statement '{statement}' generated incorrect set of statements:\n{translater_output}")
            raise TranslationFailedError(generic_date_parse_failure_message)
        start, end = (statements[0], statements[1]) if statement_types[0] == StatementType.START else (statements[1], statements[0])
        return start, end    
    
    def _translate_length(self, statements):
        """Converts START and LENGTH or END and LENGTH statements into a START and END statement"""
        length_translater = create_agent(self.model, all_tools, length_to_range_system_prompt, verbose=config.VERBOSE)
        statement_types = get_statement_types(statements)
        if StatementType.START in statement_types:
            # In the case of all three, ignore END
            input = '\n'.join([
                statements[statement_types.index(StatementType.START)],
                statements[statement_types.index(StatementType.LENGTH)],
            ])
        elif StatementType.END in statement_types:
            input = '\n'.join([
                statements[statement_types.index(StatementType.LENGTH)],
                statements[statement_types.index(StatementType.END)],
            ])
        else:
            raise ValueError('Invalid statements')
        translater_output = invoke_chain(length_translater, input)
        logger.debug(f"Length statements:\n{statements}\ngenerated statements:\n{translater_output}")
        out_statements = translater_output.splitlines()
        out_statement_types = get_statement_types(out_statements)
        if set(out_statement_types) != set([StatementType.START, StatementType.END]):
            logger.error(f"Length statements:\n{statements}\ngenerated incorrect set of statements:\n{translater_output}")
            raise TranslationFailedError(generic_date_parse_failure_message)
        start, end = (out_statements[0], out_statements[1]) if out_statement_types[0] == StatementType.START else (out_statements[1], out_statements[0])
        return start, end     
    
    def _translate_start_or_end_to_date(self, statement):
        words_to_date_translator = create_agent(self.model, all_tools, words_to_date_system_prompt, verbose=config.VERBOSE)
        input = ' '.join(statement.split(' ')[1:])
        translater_output = invoke_chain(words_to_date_translator, input)
        try:
            return from_iso_no_hyphens(translater_output)
        except ValueError:
            logger.error(f"Statement '{statement}' could not be translated to a date.")
            raise TranslationFailedError(generic_date_parse_failure_message)     

    def _translate_start_and_end_to_dates(self, start, end):
        """Converts a pair of START and END statements to a pair of dates"""
        return self._translate_start_or_end_to_date(start), self._translate_start_or_end_to_date(end) 
    
    def translate_to_date_range(self, input):
        """Given a human description of a date range, return start, end as dates
        May raise various errors
        Raises TranslationFailedError if the translation fails due to uncertainty in the LLM."""
        logger.debug(f'Translating input: {input}')
        logger.debug(f'Step 1: Filtering input {input}')
        filtered_input = self._filter_input(input)
        logger.debug(f'Step 2: Translating input {filtered_input} to statements')
        statements = self._convert_to_statements(filtered_input)
        statement_types = get_statement_types(statements)
        if len(statements) == 1:
            # 1 statement must be a proportion
            logger.debug(f'Step 3: Translating proportion in {input} to range')
            start, end = self._translate_proportion(statements[0])
        elif StatementType.LENGTH in statement_types:
            logger.debug(f'Step 3: Translating lengths in {input} to range')
            start, end = self._translate_length(statements)
        else:
            start, end = (statements[0], statements[1]) if statement_types[0] == StatementType.START else (statements[1], statements[0])
        logger.debug(f'Step 4: Translating start and end statements in {input} to dates')
        start_date, end_date = self._translate_start_and_end_to_dates(start, end)
        return start_date, end_date

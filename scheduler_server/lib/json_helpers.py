import jsonschema
import os.path
import json
from .logger import logger
from .datetime_helpers import from_time_string, to_time_string, TimeRange
from .model_tools import to_iso_no_hyphens, from_iso_no_hyphens


MESSAGE_SCHEMA_PATH = os.path.join(
    os.path.dirname(__file__),
    '../../assets/message_schema.json'
)
STATE_SCHEMA_PATH = os.path.join(
    os.path.dirname(__file__),
    '../../assets/state_schema.json'
)


def create_validator(schema_path):
    with open(schema_path, 'r') as schema_file:
        schema = json.load(schema_file)
    return jsonschema.Draft7Validator(schema)


message_validator = create_validator(MESSAGE_SCHEMA_PATH)
state_validator = create_validator(STATE_SCHEMA_PATH)


def validate_verbose(validator, candidate):
    try:
        validator.validate(candidate)
    except jsonschema.exceptions.ValidationError as ve:
        logger.error(f'Validation failed with message: {ve.message} and context: {ve.context}')
        raise ve


def parse_time_ranges(json_time_ranges):
    '''Create a native format time ranges array from a JSON formatted version'''
    result = []
    for day in json_time_ranges:
        day_result = []
        for time_range in day:
            day_result.append(TimeRange(
                from_time_string(time_range['from']),
                from_time_string(time_range['to'])
            ))
        result.append(day_result)
    return result


def format_time_ranges(time_ranges):
    '''Creates a JSON formatted version of the time ranges array'''
    result = []
    for day in time_ranges:
        day_result = []
        for time_range in day:
            day_result.append({
                'from': to_time_string(time_range.start_time),
                'to': to_time_string(time_range.end_time)
            })
        result.append(day_result)
    return result


def parse_found_times(json_found_times):
    '''Create a native format found times object from a JSON formatted version'''
    result = {}
    for num_attendees, slots in json_found_times:
        num_attendees_result = []
        for slot in slots:
            num_attendees_result.append({
                'date': from_iso_no_hyphens(slot['date']),
                'from': from_time_string(slot['from']),
                'to': from_time_string(slot['to'])
            })
        result[int(num_attendees)] = num_attendees_result
    return result


def format_found_times(found_times):
    '''Creates a JSON formatted version of the found times object'''
    result = {}
    for num_attendees, slots in found_times.items():
        num_attendees_result = []
        for slot in slots:
            num_attendees_result.append({
                'date': to_iso_no_hyphens(slot['date']),
                'from': to_time_string(slot['from']),
                'to': to_time_string(slot['to'])
            })
        result[str(num_attendees)] = num_attendees_result
    return result
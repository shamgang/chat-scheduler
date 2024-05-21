import os.path
import jsonschema
from referencing import Registry, Resource
import json
from .logger import logger


def get_schema_path(filename):
    return os.path.join(
        os.path.dirname(__file__),
        '../assets/',
        filename
    )


def load_json_file(path):
    with open(path, 'r') as f:
        return json.load(f)


def create_validator(schema_path):
    with open(schema_path, 'r') as schema_file:
        schema = json.load(schema_file)
    registry = Registry().with_resource(
        uri="common_schema.json",
        resource=Resource.from_contents(load_json_file(get_schema_path('common_schema.json')))
    )
    return jsonschema.Draft7Validator(schema, registry=registry)


message_validator = None
state_validator = None


def get_message_validator():
    global message_validator
    if message_validator is None:
        message_validator = create_validator(get_schema_path('message_schema.json'))
    return message_validator


def get_state_validator():
    global state_validator
    if state_validator is None:
        state_validator = create_validator(get_schema_path('state_schema.json'))
    return state_validator


def validate_verbose(validator, candidate):
    try:
        validator.validate(candidate)
    except jsonschema.exceptions.ValidationError as ve:
        logger.error(f'Validation failed with message: {ve.message} and context: {ve.context}')
        raise ve

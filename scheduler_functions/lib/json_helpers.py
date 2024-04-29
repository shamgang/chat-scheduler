import os.path
import jsonschema
from referencing import Registry, Resource
import json
from .logger import logger


def schema_path(filename):
    return os.path.join(
        os.path.dirname(__file__),
        '../assets/',
        filename
    )


def load_json_file(path):
    with open(path, 'r') as f:
        return json.load(f)


registry = Registry().with_resource(
    uri="common_schema.json",
    resource=Resource.from_contents(load_json_file(schema_path('common_schema.json')))
)


def create_validator(schema_path):
    with open(schema_path, 'r') as schema_file:
        schema = json.load(schema_file)
    return jsonschema.Draft7Validator(schema, registry=registry)


message_validator = create_validator(schema_path('message_schema.json'))
state_validator = create_validator(schema_path('state_schema.json'))


def validate_verbose(validator, candidate):
    try:
        validator.validate(candidate)
    except jsonschema.exceptions.ValidationError as ve:
        logger.error(f'Validation failed with message: {ve.message} and context: {ve.context}')
        raise ve

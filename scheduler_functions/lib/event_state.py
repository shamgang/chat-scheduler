from os import getenv
from azure.cosmos import CosmosClient, PartitionKey # type: ignore
from azure.cosmos.exceptions import CosmosResourceExistsError, CosmosResourceNotFoundError # type: ignore
from .logger import logger
from .time_grid import TimeGrid, format_time_grid, parse_time_grid
from .json_helpers import get_state_validator, validate_verbose
from .model_tools import to_iso_no_hyphens, from_iso_no_hyphens

events_container = None

def get_events_container():
    global events_container
    if events_container is None:
        events_container = CosmosClient(
            url=getenv('COSMOS_DB_URL'),
            credential=getenv('COSMOS_DB_KEY'),
            connection_verify=False if getenv('COSMOS_ALLOW_UNVERIFIED') else True,
        ).create_database_if_not_exists(
            id=getenv("COSMOS_DATABASE")
        ).create_container_if_not_exists(
            id=getenv("COSMOS_EVENT_TABLE"),
            partition_key=PartitionKey(path="/id")
        )
    return events_container


class EventState:
    def __init__(
            self,
            from_date,
            to_date,
            title='UNTITLED EVENT',
            general_avail_confirmed={},
            time_grid=None,
            names=[]
        ):
        self.from_date = from_date
        self.to_date = to_date
        self.title = title
        self.general_avail_confirmed = general_avail_confirmed
        self.time_grid = time_grid or TimeGrid(from_date, to_date)
        self.names = names
    
    def get_general_avail_confirmed(self, name):
        if name not in self.general_avail_confirmed:
            self.general_avail_confirmed[name] = False
        return self.general_avail_confirmed[name]
    
    def set_general_avail_confirmed(self, name, val):
        self.general_avail_confirmed[name] = val

    def set_title(self, title):
        self.title = title

    def add_name(self, name):
        if name not in self.names:
            self.names.append(name)


def format_event_state(event_state):
    result = {
        'fromDate': to_iso_no_hyphens(event_state.from_date),
        'toDate': to_iso_no_hyphens(event_state.to_date),
        'title': event_state.title,
        'generalAvailConfirmed': event_state.general_avail_confirmed,
        'timeGrid': format_time_grid(event_state.time_grid),
        'names': event_state.names
    }
    return result


def parse_event_state(event_json):
    return EventState(
        from_date=from_iso_no_hyphens(event_json['fromDate']),
        to_date=from_iso_no_hyphens(event_json['toDate']),
        title=event_json['title'],
        general_avail_confirmed=event_json['generalAvailConfirmed'],
        time_grid=parse_time_grid(event_json['timeGrid']),
        names=event_json['names']
    )


def create_event(event_id, from_date, to_date):
    '''Create a new event state and store by ID
    Raises KeyError if already exists.'''
    new_event = EventState(from_date, to_date)
    new_event_json = format_event_state(new_event)
    validate_verbose(get_state_validator(), new_event_json)
    try:
        get_events_container().create_item({
            "id": event_id,
            **new_event_json
        })
        logger.debug(f'Created new event: {event_id}')
        return new_event
    except CosmosResourceExistsError:
        err = f'Tried to create an event that already exists: {event_id}'
        logger.error(err)
        raise KeyError(err)


def update_event(event_id, event):
    '''Update an existing event. Raises KeyError if does not exist.'''
    event_json = format_event_state(event)
    validate_verbose(get_state_validator(), event_json)
    try:
        get_events_container().replace_item(event_id, {
            "id": event_id,
            **event_json
        })
        logger.debug(f'Updated event: {event_id}')
    except CosmosResourceNotFoundError:
        err = f'Tried to update event that does not exist: {event_id}'
        logger.error(err)
        raise KeyError(err)


def get_event_json(event_id):
    logger.debug(f'Retrieving event: {event_id}')
    try:
        item = get_events_container().read_item(item=event_id, partition_key=event_id)
        del item['id']
        validate_verbose(get_state_validator(), item)
        return item
    except CosmosResourceNotFoundError:
        err = f'Tried to get event that does not exist: {event_id}'
        logger.error(err)
        raise KeyError(err)


def get_event(event_id):
    return parse_event_state(get_event_json(event_id))

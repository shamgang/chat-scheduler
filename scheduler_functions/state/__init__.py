import json
import azure.functions as func
from ..lib.logger import logger
from ..lib.event_state import get_event_json

def main(req: func.HttpRequest) -> func.HttpResponse:
    event_id = req.route_params.get('id')
    logger.debug(f'Retrieving event state: {event_id}')
    try:
        return func.HttpResponse(
            json.dumps(get_event_json(event_id)),
            mimetype="application/json",
            status_code=200
        )
    except KeyError:
        logger.error("Event not found")
        return func.HttpResponse("Event not found", status_code=404)

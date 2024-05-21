import json
import traceback
import azure.functions as func # type: ignore
from ..lib.logger import logger
from ..lib.event_state import get_event_json

def main(req: func.HttpRequest) -> func.HttpResponse:
    event_id = None
    try:
        event_id = req.route_params.get('id')
        logger.info(f'Retrieving event state: {event_id}')
        return func.HttpResponse(
            json.dumps(get_event_json(event_id)),
            mimetype="application/json",
            status_code=200
        )
    except KeyError:
        err = f"Event not found: {event_id}"
        logger.error(f'Get state error: {err}')
        return func.HttpResponse(err, status_code=404)
    except Exception as e:
        trace = traceback.format_exc()
        logger.error(f'Unknown get state error: {trace}')
        return func.HttpResponse(trace, status_code=500)
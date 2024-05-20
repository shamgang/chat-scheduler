import traceback
import azure.functions as func
from ..lib.logger import logger

def main(req: func.HttpRequest, connection) -> func.HttpResponse:
    try:
        logger.info('Negotiate invoked')
        return func.HttpResponse(connection)
    except Exception as e:
        trace = traceback.format_exc()
        logger.error(f'An unknown error occurred in negotiate: {trace}')
        # TODO: returning arbitary trace data would be a potential vulnerability
        # if this application had any private data.
        # For now, it may be useful for debugging
        return func.HttpResponse(trace, status_code=500)

import azure.functions as func
from ..lib.logger import logger

def main(req: func.HttpRequest, connection) -> func.HttpResponse:
    logger.debug('Negotiate invoked')
    return func.HttpResponse(connection)
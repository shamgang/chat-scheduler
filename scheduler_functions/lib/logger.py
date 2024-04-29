import logging
# Logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
if not logger.hasHandlers():
    # Do this only once
    stdout_handler = logging.StreamHandler()
    stdout_handler.setLevel(logging.DEBUG)
    logger.addHandler(stdout_handler)
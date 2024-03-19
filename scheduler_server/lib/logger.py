import logging
# Logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
if not logger.hasHandlers():
    # Do this only once
    stdout_handler = logging.StreamHandler()
    stdout_handler.setLevel(logging.DEBUG)
    #formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    #stdout_handler.setFormatter(formatter)
    logger.addHandler(stdout_handler)
from enum import Enum

class ErrorType(str, Enum):
    INVALID_DATE_RANGE = 'INVALID_DATE_RANGE'
    DATE_RANGE_TRANSLATION_FAILED = 'DATE_RANGE_TRANSLATION_FAILED'
    MULTIPLE_DATE_RANGES = 'MULTIPLE_DATE_RANGES'
    INVALID_AVAILABILITY = 'INVALID_AVAILABILITY'

class TranslationFailedError(RuntimeError):
    def __init__(self, message, type=None):
        super().__init__(message)
        self.type = type
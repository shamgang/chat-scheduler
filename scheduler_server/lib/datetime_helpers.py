from datetime import datetime
import calendar
from .model_tools import from_iso_no_hyphens, to_iso_no_hyphens


GENERAL_WEEK_KEY = 'GENERAL'


def from_time_string(time_str):
    return datetime.strptime(time_str, '%I%M%p').time()


def to_time_string(time):
    return time.strftime('%H%M')


def datetime_from_iso_no_hyphens(str):
    return datetime.strptime(str, "%Y%m%d%H%M")


def datetime_to_iso_no_hyphens(dt):
    return dt.strftime("%Y%m%d%H%M")


def parse_week(week_str):
    week = week_str
    if week != GENERAL_WEEK_KEY:
        week = from_iso_no_hyphens(week)
    return week


def format_week(week):
    week_str = week
    if week_str != GENERAL_WEEK_KEY:
        week_str = to_iso_no_hyphens(week)
    return week_str


day_inds = { calendar.day_name[i]: i for i in range(7) }


class TimeRange:
    def __init__(self, start_time, end_time):
        self.start_time = start_time
        self.end_time = end_time

    def __str__(self):
        return f"{to_time_string(self.start_time)}-{to_time_string(self.end_time)}"

    def __repr__(self):
        return self.__str__()
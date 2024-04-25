from datetime import datetime, timedelta, time
import calendar
from .model_tools import from_iso_no_hyphens, to_iso_no_hyphens
from .config import SLOTS_PER_HOUR, MINUTES_PER_SLOT


GENERAL_WEEK_KEY = 'GENERAL'


def from_time_string_12(time_str):
    return datetime.strptime(time_str, '%I%M%p').time()


def from_time_string_24(time_str):
    return datetime.strptime(time_str, '%H%M').time()


def to_time_string_24(time):
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


def get_last_monday(dt):
    return dt - timedelta(days=dt.weekday())


def get_dates_between_dates(from_date, to_date):
    return [from_date + timedelta(days=i) for i in range((to_date - from_date).days + 1)]


def get_time_from_slot(slot_num):
    return time(
        int(slot_num // SLOTS_PER_HOUR),
        int((slot_num % SLOTS_PER_HOUR) * MINUTES_PER_SLOT)
    )


def get_slot_from_time(time):
    return int(time.hour * SLOTS_PER_HOUR + round(time.minute / MINUTES_PER_SLOT))


day_inds = { calendar.day_name[i]: i for i in range(7) }

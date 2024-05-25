from langchain.tools import tool
from datetime import datetime, timedelta
import calendar
from .config import config

def to_iso_no_hyphens(date_obj):
    return date_obj.isoformat().replace("-", "")


def from_iso_no_hyphens(date_string):
    return datetime.strptime(date_string, "%Y%m%d").date()


def to_range_str(start_date, end_date):
    return to_iso_no_hyphens(start_date) + '-' + to_iso_no_hyphens(end_date)


def from_range_str(range_str):
    return from_iso_no_hyphens(range_str.split('-')[0]), from_iso_no_hyphens(range_str.split('-')[1])


def _month_from_str(month):
    # Return the integer 0-11 for the month string
    return list(calendar.month_name).index(month)


def _day_of_week_from_str(day_of_week):
    # Return the weekday 0-6 m-f for the string, first letter capitalized
    return list(calendar.day_name).index(day_of_week)


def _get_target_year(month):
    # Get the assumed year for an integer month 0-11.
    # Assume we're talking about the current or upcoming instance of that month.
    today = config.GET_TODAY()
    return today.year if today.month <= month else today.year + 1


def _get_num_days_in_month(year, month):
    # Get the number of days in the given 4-digit integer year and integer month 0-11
    return calendar.monthrange(year, month)[1]


def _get_this_weekday(day_of_week):
    # Return the assumed date for a day of the week in the form "this _", taking the integer weekday
    today = config.GET_TODAY()
    days_until = day_of_week - today.weekday()
    if days_until < 0:
        days_until += 7
    return today + timedelta(days=days_until)


def _get_next_weekday(day_of_week):
    # Return the assumed date for a day of the week in the form "next _", taking the integer weekday
    today = config.GET_TODAY()
    upcoming_monday = today + timedelta(days=(7 - today.weekday())) 
    if today.weekday() < 5 or day_of_week >= 5:
        # Today is a weekday, so "next" means the instance of this day in the upcoming week
        # OR today is a weekend, but we're also referring to the weekend in the upcoming week
        return upcoming_monday + timedelta(days=day_of_week)
    else:
        # Today is a weekend, and we're referring to a weekday,
        # so "next _" refers to not the upcoming week but the week after that
        return upcoming_monday + timedelta(days=(day_of_week + 7))


@tool
def get_todays_date() -> str:
    """Get today's date in YYYYMMDD format."""
    today = config.GET_TODAY()
    return to_iso_no_hyphens(today)


@tool
def get_date_n_days_after_start_date(start_date: str, n: int) -> str:
    """Calculate the date that is n days after the start_date. Start date and calculated date are in YYYYMMDD format."""
    end_date = from_iso_no_hyphens(start_date) + timedelta(days=n)
    return to_iso_no_hyphens(end_date)


@tool
def get_date_n_days_before_end_date(end_date: str, n: int) -> str:
    """Calculate the date that is n days before the end_date. End date and calculated date are in YYYYMMDD format."""
    start_date = from_iso_no_hyphens(end_date) - timedelta(days=n)
    return to_iso_no_hyphens(start_date)


@tool
def get_year_for_month(month: str) -> str:
    """Given the full name of a month, return the year that month corresponds to."""
    # Assume we're talking about the current or upcoming instance.
    return _get_target_year(_month_from_str(month))


@tool
def get_start_and_end_dates_of_month(month: str) -> str:
    """Calculate the start and end dates of a given month. Assumes the month is the current month or within the next 11 months. \
    Expects the month name written out in full, and returns a string in the format <start>-<end> where <start> is the first date of the month and <end> is the last, \
    in YYYYMMDD format.
    """
    target_month = _month_from_str(month)
    year = _get_target_year(target_month)
    start_date = datetime(year, target_month, 1).date()
    num_days_in_month = _get_num_days_in_month(year, target_month)
    end_date = datetime(year, target_month, num_days_in_month).date()
    return to_range_str(start_date, end_date)


@tool
def get_number_of_days_in_month(month: str) -> int:
    """Calculate the number of days in a given month. Assumes the month is the current month or within the next 11 months. \
    Expects the month name written out in full, and returns the number of days in the month as an integer.
    """
    target_month = _month_from_str(month)
    year = _get_target_year(target_month)
    return _get_num_days_in_month(year, target_month)


@tool
def get_dates_for_weekend(qualifier: str) -> str:
    """Return the date range corresponding to this weekend or next weekend in the form <start>-<end> where <start> is the beginning of the weekend and\
    <end> is the end of the weekend in YYYYMMDD format.
    The input qualifier can be "this" if we are getting the date for "this weekend" or "next" for "next weekend".
    """
    # This weekend refers to the today and tomorrow if it's saturday, in any other case it refers to the following saturday and sunday.
    today = config.GET_TODAY()
    days_until_saturday = 5 - today.weekday()
    if days_until_saturday < 0:
        days_until_saturday += 7
    if qualifier == 'this' or qualifier == '':
        pass
    elif qualifier == 'next':
        days_until_saturday += 7
    else:
        raise ValueError('Invalid weekend qualifier')
    this_saturday = today + timedelta(days=days_until_saturday)
    this_sunday = this_saturday + timedelta(days=1)
    return to_range_str(this_saturday, this_sunday)


@tool
def get_date_for_day(day_of_week: str, qualifier: str) -> str:
    """Use this tool if you have the name of the weekday but no corresponding date, only a qualifier like "this" or "next".
    The first input day_of_week is a day of the week with the first letter capitalized.
    The second input qualifier is one of the following: "this", "next", or an empty string.
    Qualifier should be "this" if getting a date from a phrase like "this <day of week>".
    Returns the date for the given weekday in YYYYMMDD format.
    """
    # I wrote a chart (subjectively) of today's day of week vs "this _" vs "next _"
    # "This" means the nearest date for that day of week including today.
    # "Next" is more complicated, because for weekdays it refers to the instance of that
    # day of week in the next calendar week - for weekend days it refers to the next-nearest weekend,
    # including the current weekend if we're on a weekend.
    if qualifier == 'this' or qualifier == '':
        return _get_this_weekday(_day_of_week_from_str(day_of_week))
    elif qualifier == 'next':
        return _get_next_weekday(_day_of_week_from_str(day_of_week))
    else:
        raise ValueError('Invalid day of week qualifier')


@tool
def multiply(number1: float, number2: float) -> float:
    """Multiply number1 and number2.
    To calculate half of number1, pass 0.5 in for number2."""
    return number1 * number2


all_tools = [
    get_todays_date,
    get_date_n_days_after_start_date,
    get_date_n_days_before_end_date,
    get_year_for_month,
    get_start_and_end_dates_of_month,
    get_number_of_days_in_month,
    get_dates_for_weekend,
    get_date_for_day,
    multiply
]
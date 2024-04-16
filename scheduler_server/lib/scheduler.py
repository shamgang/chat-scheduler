from datetime import timedelta
from .datetime_helpers import get_last_monday, GENERAL_WEEK_KEY
from .model_tools import to_iso_no_hyphens
from .hour_translation import SLOTS_PER_DAY, get_time_from_slot


def _get_dates_between_dates(from_date, to_date):
    return [from_date + timedelta(days=i) for i in range((to_date - from_date).days + 1)]


def find_times(from_date, to_date, time_grids):
    '''Get overlapping times. time_grids keyed by name and then week'''
    overlap_grid = {
        dt: []
        for dt in _get_dates_between_dates(from_date, to_date)
    }
    for dt, slots in overlap_grid.items():
        for i in range(SLOTS_PER_DAY):
            slots.append([])
            for name, weeks in time_grids.items():
                last_monday = get_last_monday(dt)
                last_monday_str = to_iso_no_hyphens(last_monday)
                if last_monday_str in weeks:
                    day = weeks[last_monday_str].grid[:, dt.weekday()]
                else:
                    day = weeks[GENERAL_WEEK_KEY].grid[:, dt.weekday()]
                if day[i] == 1:
                    # This user is free at this time
                    slots[i].append(name)
    # Return time ranges by number of attendees
    time_ranges = {}
    for dt, slots in overlap_grid.items():
        start_slot = 0
        prev_slot = 0
        prev_attendees = slots[0]
        for i in range(1, SLOTS_PER_DAY):
            # If the attendees list changes, we've reached the end of a usable range
            if slots[i] != prev_attendees:
                if len(prev_attendees) > 1:
                    if len(prev_attendees) not in time_ranges:
                        time_ranges[len(prev_attendees)] = []
                    time_ranges[len(prev_attendees)].append({
                        'date': dt,
                        'from': get_time_from_slot(start_slot),
                        'to': get_time_from_slot(i)
                    })
                start_slot = i
            prev_slot += 1
            prev_attendees = slots[prev_slot]
    return time_ranges
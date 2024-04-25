from datetime import date

class Config:
    def __init__(self):
        self.reset_verbose()
        self.reset_get_today()

    def reset_verbose(self):
        self.VERBOSE = True

    def reset_get_today(self):
        self.GET_TODAY = lambda: date.today()

config = Config()

SLOTS_PER_DAY = 48
SLOTS_PER_HOUR = SLOTS_PER_DAY / 24
MINUTES_PER_SLOT = 60 / SLOTS_PER_HOUR
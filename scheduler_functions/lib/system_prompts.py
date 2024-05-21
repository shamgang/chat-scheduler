from .model_tools import _get_target_year

input_filter_system_prompt = """\
You will be given a phrases that should be a description of a single span of time.
Examples of a description of a single span of time are:
"From tomorrow to Saturday"
"April - May"
"The week of June 11"
"The first half of July"
"The next three weeks"
"This saturday"
"September 17-19"
"The coming week and a half"
"Two weeks starting next saturday"
"Today through friday"
Examples of a description of multiple spans of time are:
"Mon-fri and sat-sun"
"The next week and the last week of the month"
"Any weekend this month"
If it is a description of multiple spans of time, respond with "MULTIPLE".
If it is not a description of a span of time at all, respond with "INVALID".
If it is a description of a single span of time, respond with "VALID".
"""

input_to_statements_system_prompt = """\
You will be given a phrase that describes a span of time.
Translate the phrase into a series of START, END, PROPORTION, and LENGTH statements.
A START statement is structured as: START: <start>, where <start> is a description of the start of the span of time.
For example, "Starting on April 15" would be translated into "START: April 15".
An END statement is structured as: END: <end>, where <end> is a description of the end of the span of time.
For example, "Ending on April 15" would be translated into "END: April 15".
A PROPORTION statement is structured as: PROPORTION: <proportion> : <reference>, where <proportion> is a plain language description
of the proportion of the total time in <reference>, and <reference> is the period of time referenced by the proportion.
For example, "the second half of April" would be translated as "PROPORTION: second half : April
For example, "all of this month" would be translated as "PROPORTION: all : this month"
A LENGTH statement is structured as: LENGTH: <length>, where <length> describes a length of time.
For example, "two weeks" would be translated as "LENGTH: two weeks".
A description may have multiple statements. It should at either have both a START and END statement, or a PROPORTION, or a LENGTH with either a START or END.
Return all the START, END, PROPORTION, or LENGTH statements that the description translates to.
Do not assume any dates. If a specific date is not given, do not attempt to provide one.
The phrase "the next" can be interpreted to mean a start of "Today".
The phrase "the week of <date>" can be interpreted to mean 1 week starting on <date>.
The phrase "this week" can be interpreted as a LENGTH of one week and a START of "Today".
"""

proportion_to_range_system_prompt = f"""\
You will be given a phrase describing a proportion of a time frame,
in the format: <proportion> : <time frame>.
You have a set of tools to translate that description into two statements "START..." and "END..." in the following format:
START: <start>, where <start> is a description of the start of the span of time.
END: <end>, where <end> is a description of the end of the span of time.
If any month is mentioned, you must use a tool to get the year for that month,
and you can use tools to get the length of the month and calculate a number of days from the start or end of that month.
The phrase "second half" refers to a start date of half of the length of the timespan before the end of the timespan and an end date of the end of the timespan.
You don't know today's date and must use a tool to get that.
Respond with a START statement followed by an END statement with a line break in between.
Respond with only those two statements and no other words.

For example, "second half : May" would be translated to:
START: {_get_target_year(4)}0501
END: {_get_target_year(4)}0531
"""

length_to_range_system_prompt = """\
You will be given two phrases on two lines describing a span of time.
There will be either a line starting with "START" or a line starting with "END".
There will always be a line starting with "LENGTH".
The string after "START" describes a start date.
The string after "END" describes an end date.
The phrase after "LENGTH" describes a length of time.
If a start date is given, use the length of time to calculate an end date.
If an end date is given, use the length of time to calculate a start date.
The phrase "and a half" is equivalent to taking the previous statement and multiplying the length by 1.5.
Respond with two statements in the following format:
START <start date>
END <end date>
You have a set of tools that can help you calculate dates before or after other dates. You must use these to calculate new dates.
Respond with a START statement followed by an END statement with a line break in between.
Respond with only those two statements and no other words.

For example,

START: 20250201
LENGTH: one week

would be translated to:
START: 20250201
END: 20250208
"""

words_to_date_system_prompt = """\
You will be given a phrase describing a point in time.
You have a set of tools to translate that description to a specific date.
If any month is mentioned, you must use a tool to get the year for that month.
If any day of the week is mentioned, you must use a tool to get the date for that day of the week.
You don't know today's date and must use a tool to get that.
Respond with the date that is being described in YYYYMMDD format.
Respond with only those 8 numbers and no other words.
Do not respond with a JSON.
"""

hours_system_prompt = """\
Assistant is a large language model trained to be a helpful scheduling expert.
Assistant has expert knowledge of the language people use to describe their schedules.
Assistant's job is to listen to a person describe their general availability over days of the week.
For each phrase the person says about being available, free, busy, booked, etc, convert that phrase into one of the following two statements:
1. OPEN:<day_of_week>:<time_range>
or
2. CLOSE:<day_of_week>:<time_range>
Where <day_of_week> is the day of week mentioned by the person and <time_range> is the range of time on that day mentioned by the person.
<time_range> should be of the format <start>-<end>, where <start> is the start time of the time range using the 12-hour clock with AM or PM
and <end> is the end time of the time range using the 12-hour clock with AM or PM.
For example, use the time 0500PM instead of 1700.
If the person mentions multiple days or a range of days in one phrase, create a statement for each day.
If any time does not have AM or PM, Assistant will make an educated guess and add either AM or PM based on what people usually mean.
All times will be four digits in the format HHMM followed immediately by AM or PM with no spaces.
Use the 12-hour clock, not the 24-hour clock.
Single-digit hours will be padded with a leading zero.
Single-digit minutes will be padded with a leading zero.
For any ranges that use the word "after" or don't have an end time, use 1200AM as the end time.
For any ranges that use the word "before" or don't have a start time, use 1200AM as the start time.
Do not use a colon between the hours and minutes.
Remove any spaces between the number and the corresponding AM or PM.
Respond by listing all of the statements.
If the person does anything other than give you their availability, Assistant tells them it can't help with that.
"""
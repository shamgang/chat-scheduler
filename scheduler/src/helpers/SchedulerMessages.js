import { getLogURL } from "./LogDownload";
import { readableDatetimeRange } from "./FormatHelpers";

export const SchedulerMessages = {
  WELCOME_MESSAGE: (
    <span>
    Hey! Let me help you schedule a meeting.
    <br/><br/>
    First, tell me a date range to consider for the meeting (e.g. "the next two weeks").
    </span>
  ),
  LOADING_MESSAGE: 'Let me think...',
  DATE_ENTERED_MESSAGE: `Updated! Tap ☑️ to confirm.`,
  DATE_ENTERED_MESSAGE_SHORT: 'Updated! Tap ☑️ to confirm.',
  getMeetingTitleMessage: range => `
    Got it! ${readableDatetimeRange(range[0], range[1])}. Give me a name for the meeting.
  `,
  getNameMessage: meetingName => `
    OK, scheduling the meeting "${meetingName}". What's your first name?
  `,
  getNameMessageFresh: meetingName => `
    Hey! We're scheduling the meeting "${meetingName}". What's your first name?
  `,
  getTimesMessage: name => (
    <span>
      Hey {name}! Let's get your availability.
      <br/><br/>
      There are a lot of dates to fill out. To speed this up, you can tell me your availability for the average week (e.g. "I'm free 9am-5pm every weekday"),
      and I'll pre-fill all the weeks.
      <br/><br/>
      Tap ☑️ to move on to scheduling specific weeks.
    </span>
  ),
  GENERAL_TIME_RANGES_MESSAGE: `
  Updated! When you're done with your average availability, tap ☑️.
  `,
  GENERAL_TIME_RANGES_MESSAGE_SHORT: 'Updated! Tap ☑️ confirm.',
  SPECIFIC_AVAIL_MESSAGE: (
    <span>
      OK! Now let's get the details. Tell me your availability for the selected week.
      <br/><br/>
      Darker slots have more attendees available, and outlined slots have all attendees available.
      Your own availability is striped.
    </span>
  ),
  getSpecificAvailMessageFresh: name => (
    <span>
      Hey {name}! Tell me your availability (e.g. 9am-5pm Tuesday) and I will update the selected week.
      <br/><br/>
      Darker slots have more attendees available, and outlined slots have all attendees available.
      Your own availability is striped.
    </span>
  ),
  SPECIFIC_TIME_RANGES_MESSAGE: `
  Updated the calendar for just the selected week.
  `,
  SPECIFIC_TIME_RANGES_MESSAGE_SHORT: 'Updated!',
  INVALID_DATE_RANGE_ERROR: `
  Sorry, I didn't get that. I can only understand date ranges right now.
  `,
  DATE_RANGE_TRANSLATION_FAILED_ERROR: `
  Sorry, I didn't get that. I can only understand date ranges right now.
  `,
  MULTIPLE_DATE_RANGES_ERROR: `
  It looks like you entered multiple date ranges.
  This tool currently only works with one date range.
  Sorry! Please enter one date range.
  `,
  INVALID_AVAILABILITY_ERROR: `
  Sorry, I didn't get that. I only understand availability right now.
  `,
  getUnknownError: () => (
    <span>
      Sorry, I had an unexpected error. I printed the error to the browser logs.
      Click this link to download and send to the developer:<br/>
      <a
        href={getLogURL()}
        download="console_logs.txt"
      >
        console_logs.txt
      </a>
    </span>
  )
};
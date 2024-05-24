import { getLogURL } from "./LogDownload";

export const SchedulerMessages = {
  WELCOME_MESSAGES: [
    `
    Hey! Let me help you schedule a meeting.
    `,
    `
    First, tell me a date range to consider for the meeting - for example: "the next two weeks" - or update the calendar yourself.
    When it looks good, tap ☑️.
    `
  ],
  LOADING_MESSAGE: 'Let me think...',
  DATE_ENTERED_MESSAGE: `Updated! Tap ☑️ to confirm.`,
  DATE_ENTERED_MESSAGE_SHORT: 'Updated! Tap ☑️ to confirm.',
  NAME_MESSAGE: `
  This meeting's been saved! Share the link in the URL bar with your attendees.
  Each attendee can fill out their availability, and time slots will glow where all attendees are available.
  Now, tell me your first name to specify what times you're available!
  `,
  NAME_MESSAGE_FRESH: `
  Hey! We're in the middle of scheduling the meeting - tell me your first name if you want to update your availability. 
  `,
  TIMES_MESSAGE: `
  Got it! If you want, start by telling me your availability generally, for example: "I'm free 9am-5pm every weekday",
  and I'll pre-fill all the weeks. You can also edit manually.
  Tap ☑️ to move on to scheduling specific weeks.
  `,
  GENERAL_TIME_RANGES_MESSAGE: `
  Updated! If you're done with general availability, tap ☑️.
  `,
  GENERAL_TIME_RANGES_MESSAGE_SHORT: 'Updated! Tap ☑️ confirm.',
  SPECIFIC_AVAIL_MESSAGE: `
  OK! Now let's get the details.
  Tell me more about the week we're looking at.
  You can click to change the week, and you can also create and remove time blocks by hand.
  Tap the button in the bottom right to see where everyone's schedule overlaps.
  `,
  SPECIFIC_AVAIL_MESSAGE_FRESH: `
  Let's get your availability.
  Tell me about the week we're looking at.
  You can click to change the week, and you can also create and remove time blocks by hand.
  `,
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
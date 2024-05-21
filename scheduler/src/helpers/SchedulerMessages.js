import { getLogURL } from "./LogDownload";

export const SchedulerMessages = {
  WELCOME_MESSAGES: [
    `
    Hey! Let me help you schedule a meeting.
    `,
    `
    First, tell me the time frame - for example: "the next two weeks" - or update the calendar yourself.
    When it looks good, click OK.
    `
  ],
  LOADING_MESSAGE: 'Let me think...',
  DATE_ENTERED_MESSAGE: `Updated! Hit OK to confirm.`,
  DATE_ENTERED_MESSAGE_SHORT: 'Updated! OK to confirm.',
  NAME_MESSAGE: `
  This meeting's been saved! Copy the link in the URL bar to share with others so they can enter their availability.
  Now, tell me your first name if you're ready to fill out your availability!
  `,
  NAME_MESSAGE_FRESH: `
  Hey! We're in the middle of scheduling the meeting - tell me your first name if you want to update your availability. 
  `,
  TIMES_MESSAGE: `
  Got it! If you want, start by telling me your availability generally, for example: "I'm free 9am-5pm every weekday",
  and I'll pre-fill all the weeks. You can also edit manually.
  Hit OK to move on to scheduling specific weeks.
  `,
  GENERAL_TIME_RANGES_MESSAGE: `
  Updated! If you're done with general availability, hit OK.
  `,
  GENERAL_TIME_RANGES_MESSAGE_SHORT: 'Updated! OK to confirm.',
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
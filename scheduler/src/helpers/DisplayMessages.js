import { Authors, MessageTypes } from '../services/MessageService'
import {
  WELCOME_MESSAGES,
  LOADING_MESSAGE,
  DATE_ENTERED_MESSAGE,
  DATE_ENTERED_MESSAGE_SHORT,
  TIMES_MESSAGE,
  USER_CONFIRMED_RANGE_MESSAGE,
  NAME_MESSAGE,
  NAME_MESSAGE_FRESH,
  GENERAL_TIME_RANGES_MESSAGE,
  GENERAL_TIME_RANGES_MESSAGE_SHORT,
  SPECIFIC_AVAIL_MESSAGE,
  SPECIFIC_AVAIL_MESSAGE_FRESH,
  SPECIFIC_TIME_RANGES_MESSAGE,
  SPECIFIC_TIME_RANGES_MESSAGE_SHORT
} from './SchedulerMessages';
import { StateMachine } from './StateMachine';

/* Yet another message format - display messages conform to
    Chat library interface, from internal frontend format */
function displayMessage(text, author) {
    return {
      text: text,
      fromUser: author === Authors.USER
    }
}

// Convert the client-server message history into display messages
// Note - neither of these are the prompt message history.
function generateDisplayMessages(messages, isNew, eventState, name) {
  // temporarily store in [text, author] format for brevity
  let displayMessages = [];

  let state = StateMachine.SELECT_DATES; // track message-to-message state
  let explainedDates = false;
  let explainedGeneralAvail = false;
  let explainedSpecificAvail = false;

  // Welcome message, display only
  if (isNew) {
    // New event
    for (const msg of WELCOME_MESSAGES) {
      displayMessages.push([msg, Authors.SCHEDULER]);
    }
  } else {
    // Existing event
    displayMessages.push([NAME_MESSAGE_FRESH, Authors.SCHEDULER]);
  }

  for (const msg of messages) {
    let text;
    if ([MessageTypes.DATES, MessageTypes.TIMES].includes(msg.type)) {
      text = msg.prompt;
    } else if (msg.type === MessageTypes.RANGE) {
      if (msg.author === Authors.SCHEDULER) {
        if (!explainedDates) {
          text = DATE_ENTERED_MESSAGE;
          explainedDates = true;
        } else {
          text = DATE_ENTERED_MESSAGE_SHORT;
        }
      } else if (msg.author === Authors.USER) {
        text = USER_CONFIRMED_RANGE_MESSAGE;
        state = StateMachine.GENERAL_AVAIL;
      }
    } else if (msg.type === MessageTypes.NAME) {
      text = msg.name;
    } else if (msg.type === MessageTypes.TIME_RANGES) {
      if (state === StateMachine.GENERAL_AVAIL) {
        if (!explainedGeneralAvail) {
          text = GENERAL_TIME_RANGES_MESSAGE;
          explainedGeneralAvail = true;
        } else {
          text = GENERAL_TIME_RANGES_MESSAGE_SHORT;
        }
      } else if (state === StateMachine.SPECIFIC_AVAIL) {
        if (!explainedSpecificAvail) {
          text = SPECIFIC_TIME_RANGES_MESSAGE;
          explainedSpecificAvail = true;
        } else {
          text = SPECIFIC_TIME_RANGES_MESSAGE_SHORT;
        }
      }
    } else if (msg.type === MessageTypes.ERROR) {
      text = msg.errorMessage;
    }
    // Push the current message, except in certain cases where we hide it.
    if (text) {
      displayMessages.push([text, msg.author]);
    }
    // If a user RANGE message has already been sent, the chat
    // will prompt for a name now.
    if (
      msg.author === Authors.USER &&
      msg.type === MessageTypes.RANGE
    ) {
      displayMessages.push([NAME_MESSAGE, Authors.SCHEDULER]);
    }
    // If a user NAME message has already been sent,
    // the chat will prompt for general avail now.
    if (
      msg.author === Authors.USER &&
      msg.type === MessageTypes.NAME
    ) {
      if (eventState && name && (name in eventState.generalAvailConfirmed) && eventState.generalAvailConfirmed[name]) {
        // Prompt for specific avail
        state = StateMachine.SPECIFIC_AVAIL;
        displayMessages.push([SPECIFIC_AVAIL_MESSAGE_FRESH, Authors.SCHEDULER]);
      } else {
        // Prompt for general avail
        state = StateMachine.GENERAL_AVAIL;
        displayMessages.push([TIMES_MESSAGE, Authors.SCHEDULER]);
      } 
    }
    // If a user CONFIRM message has already been sent,
    // the chat will prompt for specific avail now
    if (
      msg.author === Authors.USER &&
      msg.type === MessageTypes.CONFIRM
    ) {
      displayMessages.push([SPECIFIC_AVAIL_MESSAGE, Authors.SCHEDULER]);
      state = StateMachine.SPECIFIC_AVAIL;
    }
  }

  // If the last message sent was from the user, add a temporary loading message
  if (
    displayMessages.length > 0 &&
    displayMessages.slice(-1)[0][1] === Authors.USER
  ) {
    displayMessages.push([LOADING_MESSAGE, Authors.SCHEDULER]);
  }

  // Convert all messages to display format
  return displayMessages.map(arr => displayMessage(arr[0], arr[1]));
}

export { generateDisplayMessages }
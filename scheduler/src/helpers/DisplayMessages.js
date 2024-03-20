import { Authors, MessageTypes } from '../services/MessageService'
import {
  WELCOME_MESSAGE,
  LOADING_MESSAGE,
  DATE_ENTERED_MESSAGE,
  DATE_ENTERED_MESSAGE_SHORT,
  TIMES_MESSAGE,
  USER_CONFIRMED_RANGE_MESSAGE,
  GENERAL_TIME_RANGES_MESSAGE,
  GENERAL_TIME_RANGES_MESSAGE_SHORT,
  SPECIFIC_AVAIL_MESSAGE,
  SPECIFIC_TIME_RANGES_MESSAGE,
  SPECIFIC_TIME_RANGES_MESSAGE_SHORT
} from './SchedulerMessages';
import { StateMachine } from './StateMachine';

/* Yet another message format - display messages conform to
    Chat library interface, from internal frontend format */
function toDisplayFormat(msg) {
    return {
      text: msg.text,
      user: {
        id: msg.author.toLowerCase() // Minchat assumes lowercase ID in their comparison logic
      }
    }
}

// Convert the client-server message history into display messages
// Note - neither of these are the prompt message history.
function generateDisplayMessages(messages) {
  let displayMessages = [];

  // Welcome message, display only
  displayMessages.push({
    text: WELCOME_MESSAGE,
    type: MessageTypes.TEXT,
    author: Authors.SCHEDULER
  });

  let state = StateMachine.SELECT_DATES; // track message-to-message state
  let explainedDates = false;
  let explainedGeneralAvail = false;
  let explainedSpecificAvail = false;
  for (const msg of messages) {
    let displayMessage = {...msg};
    // Replace prefixed messages with a readable message
    if (displayMessage.type === MessageTypes.RANGE) {
      if (displayMessage.author === Authors.SCHEDULER) {
        if (!explainedDates) {
          displayMessage.text = DATE_ENTERED_MESSAGE;
          explainedDates = true;
        } else {
          displayMessage.text = DATE_ENTERED_MESSAGE_SHORT;
        }
      } else if (displayMessage.author === Authors.USER) {
        displayMessage.text = USER_CONFIRMED_RANGE_MESSAGE;
        state = StateMachine.GENERAL_AVAIL;
      }
    }
    if (displayMessage.type === MessageTypes.TIME_RANGES) {
      if (state === StateMachine.GENERAL_AVAIL) {
        if (!explainedGeneralAvail) {
          displayMessage.text = GENERAL_TIME_RANGES_MESSAGE;
          explainedGeneralAvail = true;
        } else {
          displayMessage.text = GENERAL_TIME_RANGES_MESSAGE_SHORT;
        }
      } else if (state === StateMachine.SPECIFIC_AVAIL) {
        if (!explainedSpecificAvail) {
          displayMessage.text = SPECIFIC_TIME_RANGES_MESSAGE;
          explainedSpecificAvail = true;
        } else {
          displayMessage.text = SPECIFIC_TIME_RANGES_MESSAGE_SHORT;
        }
      }
    }
    if (displayMessage.type === MessageTypes.TIMES) {
      displayMessage.text = displayMessage.text.substring(displayMessage.text.indexOf(':') + 1);
    }
    // Push the current message, except in certain cases where we hide it.
    if (displayMessage.type !== MessageTypes.CONFIRM) {
      displayMessages.push(displayMessage);
    }
    // If a user RANGE message has already been sent, the chat
    // will prompt for times now.
    if (
      displayMessage.author === Authors.USER &&
      displayMessage.type === MessageTypes.RANGE
    ) {
      displayMessages.push({
        text: TIMES_MESSAGE,
        type: MessageTypes.TEXT,
        author: Authors.SCHEDULER
      });
    }
    // If a user CONFIRM message has already been sent,
    // the chat will prompt for specific avail now
    if (
      displayMessage.author === Authors.USER &&
      displayMessage.type === MessageTypes.CONFIRM
    ) {
      displayMessages.push({
        text: SPECIFIC_AVAIL_MESSAGE,
        type: MessageTypes.TEXT,
        author: Authors.SCHEDULER
      });
      state = StateMachine.SPECIFIC_AVAIL;
    }
  }

  // If the last message sent was from the user, add a temporary loading message
  if (
    displayMessages.length > 0 &&
    displayMessages.slice(-1)[0].author === Authors.USER
  ) {
    displayMessages.push({
      text: LOADING_MESSAGE,
      type: MessageTypes.TEXT,
      author: Authors.SCHEDULER
    });
  }

  // Convert all messages to display format
  return displayMessages.map(toDisplayFormat);
}

export { generateDisplayMessages }
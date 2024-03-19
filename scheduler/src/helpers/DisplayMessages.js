import { Authors, MessageTypes } from '../services/MessageService'
import {
  WELCOME_MESSAGE,
  LOADING_MESSAGE,
  DATE_ENTERED_MESSAGE,
  TIMES_MESSAGE,
  USER_CONFIRMED_RANGE_MESSAGE,
  TIME_RANGES_MESSAGE
} from './SchedulerMessages';

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

  for (const msg of messages) {
    let displayMessage = {...msg};
    // Replace range messages with a readable message
    if (displayMessage.type === MessageTypes.RANGE) {
      if (displayMessage.author === Authors.SCHEDULER) {
        displayMessage.text = DATE_ENTERED_MESSAGE;
      } else if (displayMessage.author === Authors.USER) {
        displayMessage.text = USER_CONFIRMED_RANGE_MESSAGE;
      }
    }
    if (displayMessage.type === MessageTypes.TIME_RANGES) {
      displayMessage.text = TIME_RANGES_MESSAGE;
    }
    // Push the current message
    displayMessages.push(displayMessage);
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
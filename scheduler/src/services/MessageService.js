import { useEffect, useCallback, useState, useRef } from 'react';
import commonSchema from '../assets/common_schema.json';
import messageSchema from '../assets/message_schema.json';
import Ajv from 'ajv';
import {
  toIsoNoHyphens,
  fromIsoNoHyphens,
  formatTimeString,
  dateTimeToIsoNoHyphens
} from '../helpers/FormatHelpers';

const PUBSUB_NEGOTIATE_ENDPOINT = process.env.REACT_APP_API_HOST + '/api/negotiate';

const ajv = new Ajv({verbose: true});

const validate = ajv.addSchema(commonSchema).compile(messageSchema);

const Authors = {
  USER: "USER",
  SCHEDULER: "SCHEDULER"
}

const MessageTypes = {
  RANGE: "RANGE",
  DATES: "DATES",
  MEETING_TITLE: "MEETING_TITLE",
  NAME: "NAME",
  TIMES: "TIMES",
  TIME_GRID: "TIME_GRID",
  CONFIRM: "CONFIRM",
  TOGGLE_SLOTS: "TOGGLE_SLOTS",
  TOGGLE_GENERAL_SLOTS: "TOGGLE_GENERAL_SLOTS",
  ERROR: "ERROR"
};

const ErrorTypes = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  DATE_RANGE_TRANSLATION_FAILED: 'DATE_RANGE_TRANSLATION_FAILED',
  MULTIPLE_DATE_RANGES: 'MULTIPLE_DATE_RANGES',
  INVALID_AVAILABILITY: 'INVALID_AVAILABILITY'
};

const WebSocketState = {
  0: 'CONNECTING',
  1: 'OPEN',
  2: 'CLOSING',
  3: 'CLOSED'
};

const UpdateTypes = {
  PROMPT: 'PROMPT',
  MANUAL: 'MANUAL'
}

const GENERAL_AVAIL_KEY = "GENERAL"

/* Change a scheduler message from json format to internal format */
function parseMessage(msg_str) {
  let msg = JSON.parse(msg_str);
  if (!validate(msg)) {
    console.log(msg);
    console.log(validate.errors);
    throw new Error('Invalid message format');
  }
  if (msg.type === MessageTypes.RANGE) {
    msg.fromDate = fromIsoNoHyphens(msg.fromDate);
    msg.toDate = fromIsoNoHyphens(msg.toDate);
  }
  // NOTE: not parsing time grid date keys - leave as strings
  return msg;
}

/* Convert user message message from internal to json format */
function formatMessage(msg) {
  if (msg.type === MessageTypes.RANGE) {
    msg.fromDate = toIsoNoHyphens(msg.fromDate);
    msg.toDate = toIsoNoHyphens(msg.toDate);
  } else if (msg.type === MessageTypes.TIMES) {
    if (msg.week !== GENERAL_AVAIL_KEY) {
      msg.week = toIsoNoHyphens(msg.week);
    }
  } else if (msg.type === MessageTypes.TOGGLE_SLOTS) {
    msg.from = dateTimeToIsoNoHyphens(msg.from);
    msg.to = dateTimeToIsoNoHyphens(msg.to);
  } else if (msg.type === MessageTypes.TOGGLE_GENERAL_SLOTS) {
    msg.from = formatTimeString(msg.from);
    msg.to = formatTimeString(msg.to);
  }
  if (!validate(msg)) {
    console.error('Validation failed:', msg);
    console.error('Validation errors:', validate.errors);
    throw new Error('Invalid message format');
  }
  return JSON.stringify(msg);
}

  // Throws
async function getWebSocketUrl() {
  try {
    let res = await fetch(PUBSUB_NEGOTIATE_ENDPOINT);
    if (!res.ok) {
      const errMsg = `Negotiate request error: ${res.status} ${res.statusText}`
      let error = new Error(errMsg);
      error.status = res.status;
      error.statusText = res.statusText;
      error.body = await res.text();
      error.response = res;
      console.error(error, res, { body: error.body });
      throw error;
    }
    return (await res.json()).url;
  } catch (err) {
    console.error('Get websocket URL failed: ', err);
    throw err;
  }
};  

function onOpen(event) {
  console.log(`Websocket open with state: ${WebSocketState[event.target.readyState]}`, event);
};

function onError(event) {
  console.error(`Websocket error with state: ${WebSocketState[event.target.readyState]}`, event);
};

function closeWebSocket(ws) {
  console.log('Closing websocket from client.');
  ws.closedByClient = true; // Mark as intentionally closed by front end
  ws.close(1000, 'Closed by client.');
};

/* Return interfaces for the message service
    messages: list of messages in frontend format (see def above)
    sendMessage: send a message
*/
function useMessageService(onSchedulerMessage) {
  const webSocketRef = useRef(null);
  const webSocketReady = useRef(null);
  const [ messageServiceError, setMessageServiceError ] = useState(null);
  const timeouts = useRef([]);
  const numReopens = useRef(0);
  const lastOpen = useRef(null);
  const createWebSocket = useRef(null); // Resolve circular dependency between onClose and createWebSocket
  const initialized = useRef(false);

  const onClose = useCallback((event) => {
    console.log(`Websocket closed with state: ${WebSocketState[event.target.readyState]}`, event);
    if (event.target.closedByClient) {
      console.debug('Websocket closed by client.');
    } else {
      if ((new Date()).getTime() - lastOpen.current.getTime() > 5 * 1000 * 60) {
        // More than 5 minutes have passed since last attempted, reset retries to allow for regular timeouts.
        console.debug('Resetting retries.');
        numReopens.current = 0;
      }
      if (numReopens.current < 3) {
        console.warn('Websocket closed unexpectedly. Attempting to re-open.');
        webSocketRef.current = null;
        createWebSocket.current();
        numReopens.current += 1;
      } else {
        const err = 'Websocket closed unexpectedly.'
        console.error(err);
        setMessageServiceError(err);
      }
    }
  }, [setMessageServiceError]);

  const onMessage = useCallback((event) => {
    console.log(`Message received from websocket with state: ${WebSocketState[event.target.readyState]}`, event);
    const msg = parseMessage(event.data);
    if (msg.author === Authors.SCHEDULER) {
      onSchedulerMessage(msg);
    }
  }, [onSchedulerMessage]);

  // Create websocket async. Skip creation if context.pending is set to false before creation executes.
  // Resolve with websocket object or nothing.
  createWebSocket.current = useCallback(() => {
    console.log('Creating websocket.');
    webSocketReady.current = new Promise((resolve) => {
      (async () => {
        try {
          const url = await getWebSocketUrl();
          let ws = new WebSocket(url);
          console.log(`Websocket created with state: ${WebSocketState[ws.readyState]}`);
          ws.onopen = onOpen;
          ws.onclose = onClose;
          ws.onerror = onError;
          ws.onmessage = onMessage;
          webSocketRef.current = ws;
          lastOpen.current = new Date();
          resolve(true);
        } catch (err) {
          console.error('Failed to create websocket: ', err);
          setMessageServiceError(err);
          resolve(false);
        }
      })();
    });
  }, [onClose, onMessage, setMessageServiceError]);

  // Websocket creation on mount and cleanup on dismount.
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    createWebSocket.current();
    initialized.current = true;

    return () => {
      if (
        webSocketRef.current &&
        !(
          [WebSocket.CLOSED, WebSocket.CLOSING].includes(webSocketRef.current.readyState)
        )
      ) {
        closeWebSocket(webSocketRef.current);
        webSocketRef.current = null;
      }
    };
  }, []);

  // Since websocket handlers are attached only on creation, add effects
  // to update the handlers if they change.
  useEffect(() => {
    if (webSocketRef.current) {
      webSocketRef.current.onmessage = onMessage;
    }
  }, [onMessage]);
  useEffect(() => {
    if (webSocketRef.current) {
      webSocketRef.current.onclose = onClose;
    }
  }, [onClose]);

  // Send message on websocket
  // Throws
  const sendMessageNow = useCallback(async (msg) => {
    msg.author = Authors.USER;
    console.debug('Send attempt: ', msg);
    if ((await webSocketReady.current) && webSocketRef.current) {
      webSocketRef.current.send(formatMessage(msg));
    } else {
      throw new Error('No websocket');
    }
  }, []);

  const sendMessageDelay = useCallback((msg, delay) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        (async() => {
          try {
            resolve(await sendMessageNow(msg));
          } catch (err) {
            reject(err);
          }
        })();
      }, delay);
      timeouts.current.push(timeout);
    });
  }, [sendMessageNow]);

  // Timeout cleanup on dismount
  useEffect(() => {
    return () => {
      for (const to of timeouts.current) {
        clearTimeout(to);
      }
      timeouts.current = []
    };
  }, []);

  const sendMessage = useCallback((msg) => {
    (async () => {
      console.debug('Attempting to send message: ', msg);
      // First try
      try {
        await sendMessageNow(msg);
        return;
      } catch (error) {
        console.error('Send message failed 1 time:', error);
      }
      // Second try, 1s
      console.log('Retrying..');
      try {
        await sendMessageDelay(msg, 1000);
        return;
      } catch (error) {
        console.error('Send message failed 2 times:', error);
      }
      // Third try, 3s
      console.log('Retrying..');
      try {
        await sendMessageDelay(msg, 3000);
        return;
      } catch (error) {
        console.error('Send message failed 3 times:', error);
      }
      // Fourth try, 7s
      console.log('Retrying..');
      try {
        await sendMessageDelay(msg, 7000);
        return;
      } catch (error) {
        console.error('Send message failed 4 times:', error);
        setMessageServiceError(error);
      }
    })();
  }, [sendMessageNow, sendMessageDelay, setMessageServiceError]);

  return { sendMessage, messageServiceError };
}

export {
  useMessageService,
  MessageTypes,
  ErrorTypes,
  UpdateTypes,
  Authors,
  GENERAL_AVAIL_KEY
};
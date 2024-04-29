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
  NAME: "NAME",
  TIMES: "TIMES",
  TIME_GRID: "TIME_GRID",
  CONFIRM: "CONFIRM",
  TOGGLE_SLOTS: "TOGGLE_SLOTS",
  TOGGLE_GENERAL_SLOTS: "TOGGLE_GENERAL_SLOTS",
  ERROR: "ERROR"
};

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

/* Return interfaces for the message service
    messages: list of messages in frontend format (see def above)
    sendMessage: send a message
*/
function useMessageService() {
  const [ messages, setMessages ] = useState([]);
  const [ webSocket, setWebSocket ] = useState(null);
  const timeouts = useRef([]);

  const onMessage = useCallback((event) => {
    setMessages((prevMessages) => [...prevMessages, parseMessage(event.data)]);
  }, [setMessages]);

  useEffect(() => {
    let ws;

    (async () => {
      let res = await fetch(PUBSUB_NEGOTIATE_ENDPOINT);
      let url = (await res.json()).url;
      if (ws === undefined) { // undefined means pending
        console.log('Websocket opened.');
        ws = new WebSocket(url);
        ws.onmessage = onMessage;
        setWebSocket(ws);
      }
    })().catch(console.error);

    return () => {
      if (ws) {
        console.log('Websocket closed.');
        ws.close();
      }
      ws = null; // Use null as an indicator that the websocket is closed, rather than pending.
      for (const to of timeouts.current) {
        clearTimeout(to);
      }
      timeouts.current = []
    };
  
  }, [setWebSocket, onMessage]);

  // Send message or return error message
  const sendMessageNow = useCallback((msg) => {
    if (webSocket) {
      try {
        webSocket.send(formatMessage(msg));
      } catch (error) {
        return error.toString();
      }
      setMessages((prevMessages) => [...prevMessages, msg]);
      return null;
    } else {
      return 'No websocket';
    }
  }, [webSocket, setMessages]);

  const sendMessageDelay = useCallback((msg, delay) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(sendMessageNow(msg));
      }, delay);
      timeouts.current.push(timeout);
    });
  }, [sendMessageNow]);

  const sendMessage = useCallback((msg) => {
    // First try
    const error = sendMessageNow(msg);
    if (error) {
      console.error('Send message failed 1 time:', error);
      (async () => {
        // Second try, 500ms
        console.log('Retrying..');
        let error = await sendMessageDelay(msg, 500);
        if (error) {
          console.error('Send message failed 2 times:', error);
          // Third try, 2s
          console.log('Retrying..');
          error = await sendMessageDelay(msg, 2000);
          if (error) {
            console.error('Send message failed 3 times:', error);
            throw new Error(error);
          }
        }
      })();
    }
  }, [sendMessageNow, sendMessageDelay]);

  return { messages, sendMessage, setMessages };
}

export {
  useMessageService,
  MessageTypes,
  Authors,
  GENERAL_AVAIL_KEY
};
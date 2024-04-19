import { v4 as uuidv4 } from "uuid";
import { useEffect, useMemo, useCallback } from 'react';
import { ChainlitAPI, sessionState, useChatSession, useChatMessages, useChatInteract } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';
import moment from 'moment';
import schema from '../assets/message_schema.json';
import Ajv from 'ajv';
import {
  parseTimeRanges,
  toIsoNoHyphens,
  fromIsoNoHyphens,
  parseFoundTimes,
  formatFoundTimes,
  formatTimeString
} from '../helpers/FormatHelpers';

const CHAINLIT_SERVER_URL = 'http://192.168.0.134:8000';

const apiClient = new ChainlitAPI(CHAINLIT_SERVER_URL);

const ajv = new Ajv({verbose: true});

const validate = ajv.compile(schema);

const Authors = {
  USER: "USER",
  SCHEDULER: "SCHEDULER"
}

const MessageTypes = {
  RANGE: "RANGE",
  DATES: "DATES",
  NAME: "NAME",
  TIMES: "TIMES",
  TIME_RANGES: "TIME_RANGES",
  CONFIRM: "CONFIRM",
  CLOSE: "CLOSE",
  OPEN: "OPEN",
  FIND_TIMES: "FIND_TIMES",
  FOUND_TIMES: "FOUND_TIMES",
  ERROR: "ERROR"
};

const GENERAL_AVAIL_KEY = "GENERAL"


function dateTimeFromIsoNoHyphens(dateTimeStr) {
  return new Date(
    parseInt(dateTimeStr.substring(0, 4), 10),
    parseInt(dateTimeStr.substring(4, 6), 10) - 1,
    parseInt(dateTimeStr.substring(6, 8), 10),
    parseInt(dateTimeStr.substring(8, 10), 10),
    parseInt(dateTimeStr.substring(10, 12), 10)
  );
}

function dateTimeToIsoNoHyphens(dt) {
  return moment(dt).format('YYYYMMDDHHmm');
}

/* Change a message from json format to internal format */
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
  } else if (msg.type === MessageTypes.TIMES) {
    msg.week = fromIsoNoHyphens(msg.week);
  } else if (msg.type === MessageTypes.TIME_RANGES) {
    msg.timeRanges = parseTimeRanges(msg.timeRanges);
  } else if ([MessageTypes.OPEN, MessageTypes.CLOSE].includes(msg.type)) {
    msg.from = dateTimeFromIsoNoHyphens(msg.from);
    msg.to = dateTimeFromIsoNoHyphens(msg.to);
  } else if (msg.type === MessageTypes.FOUND_TIMES) {
    msg.foundTimes = parseFoundTimes(msg.foundTimes)
  }
  return msg;
}

/* Convert message from internal to json format */
function formatMessage(msg) {
  if (msg.type === MessageTypes.RANGE) {
    msg.fromDate = toIsoNoHyphens(msg.fromDate);
    msg.toDate = toIsoNoHyphens(msg.toDate);
  } else if (msg.type === MessageTypes.TIMES) {
    if (msg.week !== GENERAL_AVAIL_KEY) {
      msg.week = toIsoNoHyphens(msg.week);
    }
  } else if (msg.type === MessageTypes.TIME_RANGES) {
    for (const day of msg.timeRanges) {
      for (let timeRange of day) {
        timeRange.from = formatTimeString(timeRange.from);
        timeRange.to = formatTimeString(timeRange.to);
      }
    }
  } else if ([MessageTypes.OPEN, MessageTypes.CLOSE].includes(msg.type)) {
    msg.from = dateTimeToIsoNoHyphens(msg.from);
    msg.to = dateTimeToIsoNoHyphens(msg.to);
  } else if (msg.type === MessageTypes.FOUND_TIMES) {
    msg.foundTimes = formatFoundTimes(msg.foundTimes)
  }
  if (!validate(msg)) {
    console.error('Validation failed:', msg);
    console.error('Validation errors:', validate.errors);
    throw new Error('Invalid message format');
  }
  return {
    id: uuidv4(),
    name: msg.author,
    type: msg.author === Authors.USER ? 'user_message' : 'assistant_message', // this is a TS enum in chainlit
    output: JSON.stringify(msg),
    createdAt: new Date().toISOString(),
  };
}

/* Return interfaces for the message service
    messages: list of messages in frontend format (see def above)
*/
function useMessageService() {
  const { connect, disconnect } = useChatSession();
  const { messages: chainlitMessages } = useChatMessages();
  const { sendMessage: chainlitSendMessage } = useChatInteract();
  const session = useRecoilValue(sessionState);

  // Start chainlit session on mount
  useEffect(() => {
    if (session?.socket.connected) {
      return
    }
    /*
    fetch(apiClient.buildEndpoint("/custom-auth"))
    .then(res => {
    return res.json();
    })
    .then(data => {
    connect({
        client: apiClient,
        userEnv: {
        },
        accessToken: `Bearer: ${data.token}`
    })
    });
    */

    connect({
      client: apiClient,
      userEnv: {}
    });

    // TODO: can't disconnect because I can't get it to not
    // run early
    // TODO: can't put dependencies here correctly because
    // the connection keeps getting messed up
  }, []);

  const messages = useMemo(
    () => chainlitMessages.map((msg) => parseMessage(msg.output)),
    [chainlitMessages]
  );

  const sendMessage = useCallback((msg) => {
    chainlitSendMessage(formatMessage(msg), []);
  }, [chainlitSendMessage]);

  return { messages, sendMessage };
}

export {
  useMessageService,
  MessageTypes,
  Authors,
  GENERAL_AVAIL_KEY,
  toIsoNoHyphens
};
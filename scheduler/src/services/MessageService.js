import { v4 as uuidv4 } from "uuid";
import { useEffect, useMemo, useCallback } from 'react';
import { ChainlitAPI, sessionState, useChatSession, useChatMessages, useChatInteract } from '@chainlit/react-client';
import { useRecoilValue } from 'recoil';
import moment from 'moment';
import { formatDay } from "../helpers/Dates";

const CHAINLIT_SERVER_URL = 'http://localhost:8000';

const apiClient = new ChainlitAPI(CHAINLIT_SERVER_URL);

const Authors = {
  USER: "USER",
  SCHEDULER: "SCHEDULER"
}

const MessageTypes = {
  TEXT: "TEXT",
  RANGE: "RANGE",
  DATES: "DATES",
  TIMES: "TIMES",
  TIME_RANGES: "TIME_RANGES",
  CONFIRM: "CONFIRM",
  CLOSE: "CLOSE",
  OPEN: "OPEN",
  ERROR: "ERROR"
};

const GENERAL_AVAIL_KEY = "GENERAL"

function getMessageType(str) {
  return str.substring(0, str.indexOf(':'));
}

function removeMessageType(str) {
  return str.substring(str.indexOf(':') + 1);
}

function fromIsoNoHyphens(dateStr) {
  return new Date(
    parseInt(dateStr.substring(0, 4)),
    parseInt(dateStr.substring(4, 6)) - 1,
    parseInt(dateStr.substring(6, 8))
  );
}

/* Parse a string in the format YYYYMMDD-YYYYMMDD to two dates */
function parseRange(rangeStr) {
  const fromDate = fromIsoNoHyphens(rangeStr.split('-')[0]);
  const toDate = fromIsoNoHyphens(rangeStr.split('-')[1]);
  return { fromDate, toDate };
}

function parseTimeString(timeStr) {
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = parseInt(timeStr.substring(2, 4), 10);
  return {hour, minute};
}

function pad2(int) {
  if (int < 10 && int > -10) {
    return '0' + int.toString();
  } else {
    return int.toString();
  }
}

function formatTimeRange({from, to}) {
  return pad2(from.hour) + pad2(from.minute) + '-' + pad2(to.hour) + pad2(to.minute);
}

/* Parse a string containing comma-separated time ranges on a line per day of the week
    Result will be 2D array with each range an object like:
    { from: {hour, minute}, to: {hour, minute} }.
*/
function parseTimeRanges(rangesStr) {
  const dayLines = rangesStr.split('\n');
  let allTimeRanges = [];
  for (const line of dayLines) {
    let timeRanges = [];
    if (line !== '') {
      const timeRangeStrs = line.split(',');
      for (const rangeStr of timeRangeStrs) {
        const [from, to] = rangeStr.split('-').map(parseTimeString);
        timeRanges.push({from, to});
      }
    }
    allTimeRanges.push(timeRanges);
  }
  return allTimeRanges;
}

function formatTimeRanges(timeRanges) {
  return timeRanges.map((day) => {
    return day.map((range) => {
      return range.join('-');
    }).join(',');
  }).join('\n');
}

/* Change a message from backend to frontend format
    Backend format is chainlit message format.
    Frontend format is { type, author, text, ... }
      RANGE messages have fromDate, toDate
      TIME_RANGES messages have timeRanges
      TIME messages have week, timesPrompt
      OPEN and CLOSE messages have from, to
*/
function parseMessage(msg) {
  let parsedMessage = {
    author: msg.name,
    type: getMessageType(msg.output),
    text: removeMessageType(msg.output)
  };
  if (parsedMessage.type === MessageTypes.RANGE) {
    const { fromDate, toDate } = parseRange(parsedMessage.text);
    parsedMessage.fromDate = fromDate;
    parsedMessage.toDate = toDate;
  } else if (parsedMessage.type === MessageTypes.TIME_RANGES) {
    const timeRanges = parseTimeRanges(parsedMessage.text);
    parsedMessage.timeRanges = timeRanges;
  } else if (parsedMessage.type === MessageTypes.TIMES) {
    const [week, timesPrompt] = parsedMessage.text.split(':');
    parsedMessage.week = week;
    parsedMessage.timesPrompt = timesPrompt;
  }
  return parsedMessage;
}

function toIsoNoHyphens(date) {
  return moment(date).format('YYYYMMDD');
}

function formatRange(fromDate, toDate) {
  return `${toIsoNoHyphens(fromDate)}-${toIsoNoHyphens(toDate)}`
}

function addMessageType(str, type) {
  return `${type}:${str}`;
}

/* Change message from frontend to backend format
    See definitions above
*/
function formatMessage(msg) {
  let content;
  if (msg.type === MessageTypes.RANGE) {
    content = formatRange(msg.fromDate, msg.toDate);
  } else if (msg.type === MessageTypes.TIMES) {
    let week;
    if (msg.week) {
      week = toIsoNoHyphens(msg.week);
    } else {
      week = GENERAL_AVAIL_KEY
    }
    content = week + ':' + msg.text;
  } else if (msg.type === MessageTypes.CONFIRM) {
    content = '';
  } else if (msg.type === MessageTypes.OPEN || msg.type === MessageTypes.CLOSE) {
    const timeRange = {
      from: { hour: msg.from.getHours(), minute: msg.from.getMinutes() },
      to: { hour: msg.to.getHours(), minute: msg.to.getMinutes() },
    }
    content = toIsoNoHyphens(msg.from) + ':' + formatTimeRange(timeRange);
  } else {
    content = msg.text;
  }
  content = addMessageType(content, msg.type);
  return {
    id: uuidv4(),
    name: msg.author,
    type: msg.author === Authors.USER ? 'user_message' : 'assistant_message', // this is a TS enum in chainlit
    output: content,
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
    () => chainlitMessages.map((msg) => parseMessage(msg)),
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
  formatTimeRanges,
  GENERAL_AVAIL_KEY,
  toIsoNoHyphens,
  fromIsoNoHyphens
};
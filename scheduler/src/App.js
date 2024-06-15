import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import './App.css';
import Chat from './components/Chat';
import MonthlyCalendar from './components/MonthlyCalendar';
import GeneralWeeklyCalendar from './components/GeneralWeeklyCalendar';
import SpecificWeeklyCalendar from './components/SpecificWeeklyCalendar';
import { 
  useMessageService,
  MessageTypes,
  ErrorTypes,
  UpdateTypes,
  GENERAL_AVAIL_KEY
} from './services/MessageService';
import {
  SchedulerMessages as M
} from './helpers/SchedulerMessages';
import { StateMachine } from './helpers/StateMachine';
import { getEventState } from "./services/StateService";
import { getRandomBackgroundImageUrl } from "./helpers/BackgroundImage";
import { lastMonday, getDayOfWeek, getDateRangeLengthDays } from "./helpers/Dates";
import { findBestTime } from "./helpers/CalendarHelpers";

export async function loader({ params }) {
  // TODO: want to use loader to load data before rendering,
  // but need context to know if it's a fresh load - don't want to
  // hit the server if it's not a fresh load.
  // https://github.com/remix-run/react-router/issues/9324
  return {}
}

const BACKGROUND_IMAGE = getRandomBackgroundImageUrl();

function App() {
  const [eventStateError, setEventStateError] = useState(null);
  if (eventStateError) {
    throw eventStateError;
  }
  const [range, setRange] = useState([new Date(), new Date()]);
  const [rangeEmpty, setRangeEmpty] = useState(true);
  // Time ranges here will be a map of key to 3D time ranges array.
  // Each key will represent a different week or general availability.
  const [timeGrid, setTimeGrid] = useState(null);
  const [flowState, setFlowState] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(lastMonday(new Date()));
  const { eventId } = useParams();
  const [eventState, setEventState] = useState(null); // TODO: this contains some redundant data
  const [title, setTitle] = useState('NEW MEETING');
  const [name, setName] = useState(null);
  const [names, setNames] = useState(null);
  const [displayMessages, setDisplayMessages] = useState([]);
  const navigate = useNavigate();
  const initialized = useRef(false);
  const explainedDates = useRef(false);
  const explainedGeneralAvail = useRef(false);
  const explainedSpecificAvail = useRef(false);

  const backgroundStyle = {
    backgroundImage: `url(${BACKGROUND_IMAGE})`
  };

  const pushDisplayMessage = useCallback((text, fromUser) => {
    setDisplayMessages(msgs => [...msgs, { text, fromUser }]);
  }, [setDisplayMessages]);

  const popLoadingMessage = useCallback(() => {
    setDisplayMessages(msgs => msgs.slice(-1)[0]?.text === M.LOADING_MESSAGE ? msgs.slice(0, -1) : msgs);
  }, [setDisplayMessages]);

  const pushUserDisplayMessage = useCallback(text => {
    pushDisplayMessage(text, true);
    pushDisplayMessage(M.LOADING_MESSAGE, false);
  }, [pushDisplayMessage]);

  const pushSchedulerDisplayMessage = useCallback(text => {
    popLoadingMessage();
    pushDisplayMessage(text, false);
  }, [popLoadingMessage, pushDisplayMessage]);

  const onSchedulerMessage = useCallback(msg => {
    if (msg.type ===  MessageTypes.RANGE) {
      console.log(`Chatbot range change from: ${msg.fromDate} to: ${msg.toDate}`);
      setRange([msg.fromDate, msg.toDate]);
      setRangeEmpty(false);
      setCurrentWeek(lastMonday(msg.fromDate));
      if (!explainedDates.current) {
        pushSchedulerDisplayMessage(M.DATE_ENTERED_MESSAGE);
        explainedDates.current = true;
      } else {
        pushSchedulerDisplayMessage(M.DATE_ENTERED_MESSAGE_SHORT);
      }
    } else if (msg.type === MessageTypes.TIME_GRID) {
      if (msg.updateType === UpdateTypes.PROMPT) {
        console.log('Chatbot setting time grid:', msg.timeGrid);  
        setTimeGrid(msg.timeGrid);
        if (flowState === StateMachine.GENERAL_AVAIL) {
          if (!explainedGeneralAvail.current) {
            pushSchedulerDisplayMessage(M.GENERAL_TIME_RANGES_MESSAGE);
            explainedGeneralAvail.current = true;
          } else if (msg) {
            pushSchedulerDisplayMessage(M.GENERAL_TIME_RANGES_MESSAGE_SHORT);
          }
        } else if (flowState === StateMachine.SPECIFIC_AVAIL) {
          if (!explainedSpecificAvail.current) {
            pushSchedulerDisplayMessage(M.SPECIFIC_TIME_RANGES_MESSAGE);
            explainedSpecificAvail.current = true;
          } else {
            pushSchedulerDisplayMessage(M.SPECIFIC_TIME_RANGES_MESSAGE_SHORT);
          }
        }
      } else if (msg.updateType === UpdateTypes.MANUAL) {
        console.log('User setting time grid:', msg.timeGrid);  
        setTimeGrid(msg.timeGrid);
      }
    } else if (msg.type === MessageTypes.ERROR) {
      console.error('Error message from server:', msg);
      if (msg.errorType) {
        if (msg.errorType === ErrorTypes.INVALID_DATE_RANGE) {
          pushSchedulerDisplayMessage(M.INVALID_DATE_RANGE_ERROR);
        } else if (msg.errorType === ErrorTypes.DATE_RANGE_TRANSLATION_FAILED) {
          pushSchedulerDisplayMessage(M.DATE_RANGE_TRANSLATION_FAILED_ERROR);
        } else if (msg.errorType === ErrorTypes.MULTIPLE_DATE_RANGES) {
          pushSchedulerDisplayMessage(M.MULTIPLE_DATE_RANGES_ERROR);
        } else if (msg.errorType === ErrorTypes.INVALID_AVAILABILITY) {
          pushSchedulerDisplayMessage(M.INVALID_AVAILABILITY_ERROR);
        }
      } else {
        pushSchedulerDisplayMessage(M.getUnknownError());
      }
    }
  }, [
    flowState,
    setRange,
    setRangeEmpty,
    setCurrentWeek,
    setTimeGrid,
    pushSchedulerDisplayMessage
  ]);

  const { sendMessage, messageServiceError } = useMessageService(onSchedulerMessage);
  if (messageServiceError) {
    throw messageServiceError;
  }

  // Initialize
  useEffect(() => {
    if (initialized.current) {
      // Already initialized
      return;
    }
    if (eventId) {
      // Rendering an existing event
      setFlowState(StateMachine.LOADING);
      (async () => {
        try {
          const loadedEvent = await getEventState(eventId);
          setRange([loadedEvent.fromDate, loadedEvent.toDate]);
          setCurrentWeek(lastMonday(loadedEvent.fromDate));
          setTitle(loadedEvent.title);
          setTimeGrid(loadedEvent.timeGrid);
          setNames(loadedEvent.names);
          setEventState(loadedEvent);
          setFlowState(StateMachine.NAME);
          pushSchedulerDisplayMessage(M.NAME_MESSAGE_FRESH);
        } catch (error) {
          setEventStateError(error);
        }
      })();
    } else {
      // Rendering a new event
      setFlowState(StateMachine.SELECT_DATES);
      for (const msg of M.WELCOME_MESSAGES) {
        pushSchedulerDisplayMessage(msg);
      }
    }
    initialized.current = true;
  }, [
    flowState,
    eventId,
    setEventState,
    setRange,
    setCurrentWeek,
    setFlowState,
    setTimeGrid,
    setNames,
    setEventStateError,
    pushSchedulerDisplayMessage
  ]);

  const shortRange = range && getDateRangeLengthDays(range[0], range[1]) < 10;

  const onSend = useCallback((input) => {
    // Sending a chat message
    pushUserDisplayMessage(input);
    if (flowState === StateMachine.SELECT_DATES) {
      sendMessage({
        type: MessageTypes.DATES,
        prompt: input
      });
    } else if (flowState === StateMachine.MEETING_TITLE) {
      const newTitle = input.trim();
      sendMessage({
        type: MessageTypes.MEETING_TITLE,
        eventId: eventId,
        title: newTitle
      });
      setTitle(newTitle);
      setFlowState(StateMachine.NAME);
      pushSchedulerDisplayMessage(M.NAME_MESSAGE);
    } else if (flowState === StateMachine.NAME) {
      const newName = input.trim().toLowerCase();
      sendMessage({
        type: MessageTypes.NAME,
        eventId: eventId,
        name: newName
      });
      setName(newName);
      let nextNames = [...(names || [])]
      if(!nextNames.includes(newName)) {
        nextNames.push(newName);
      }
      setNames(nextNames);
      if (
        (
          eventState &&
          newName in eventState.generalAvailConfirmed &&
          eventState.generalAvailConfirmed[newName] // user has already entered general avail
        ) || shortRange
      ) {
        // Pre-loaded backend state shows we already did general availability.
        setFlowState(StateMachine.SPECIFIC_AVAIL);
        pushSchedulerDisplayMessage(M.SPECIFIC_AVAIL_MESSAGE);
      } else {
        setFlowState(StateMachine.GENERAL_AVAIL);
        pushSchedulerDisplayMessage(M.TIMES_MESSAGE);
      }
    } else if ([StateMachine.GENERAL_AVAIL, StateMachine.SPECIFIC_AVAIL].includes(flowState)) {
      sendMessage({
        type: MessageTypes.TIMES,
        prompt: input,
        week: flowState === StateMachine.GENERAL_AVAIL ? GENERAL_AVAIL_KEY : currentWeek,
        eventId: eventId,
        name: name
      });
    } else {
      console.error(`Invalid flow state: ${flowState}, message not sent.`);
    }
  }, [
    eventId,
    eventState,
    flowState,
    currentWeek,
    name,
    names,
    shortRange,
    sendMessage,
    setFlowState,
    setTitle,
    setName,
    setNames,
    pushUserDisplayMessage,
    pushSchedulerDisplayMessage
  ]);
  // When date calendar selection changes
  const onRangeChanged = useCallback((value) => {
    console.log(`Manual range change from: ${value[0]} to: ${value[1]}`);
    setRange(value);
    setRangeEmpty(false);
    setCurrentWeek(lastMonday(value[0]));
  }, [setRange, setRangeEmpty, setCurrentWeek]);

  // When date range is confirmed
  const onConfirmRange = useCallback(() => {
    // Confirming date range
    // Now that date range is confirmed, create a persisted event
    const eventId = uuidv4();
    sendMessage({
      type: MessageTypes.RANGE,
      fromDate: range[0],
      toDate: range[1],
      eventId: eventId
    });
    setFlowState(StateMachine.MEETING_TITLE);
    navigate(`/${eventId}`);
    pushSchedulerDisplayMessage(M.getMeetingTitleMessage(range));
  }, [sendMessage, setFlowState, range, navigate, pushSchedulerDisplayMessage]);

  // Button click from weekly calendar - confirming general avail or finding times
  const onConfirmGeneralAvail = useCallback(() => {
    sendMessage({
      type: MessageTypes.CONFIRM,
      eventId: eventId,
      name: name
    });
    setFlowState(StateMachine.SPECIFIC_AVAIL);
    pushSchedulerDisplayMessage(M.SPECIFIC_AVAIL_MESSAGE);
  }, [eventId, name, setFlowState, sendMessage, pushSchedulerDisplayMessage]);

  const onFindTimes = useCallback(() => {
    const { from, to, numAttendees } = findBestTime(timeGrid, names);
    if (numAttendees === 0) {
      pushSchedulerDisplayMessage('No meeting times are currently available.');
    } else {
      const dateFormatter = new Intl.DateTimeFormat('en-us', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat('en-us', {
        hour: 'numeric', minute: 'numeric', hour12: true
      });
      const datePart = dateFormatter.format(from);
      const fromTime = timeFormatter.format(from);
      const toTime = timeFormatter.format(to); 
      pushSchedulerDisplayMessage(
        `The nearest slot with ${numAttendees}/${names.length} attendees is ${datePart} ${fromTime} - ${toTime}`
      );
    }
  }, [timeGrid, names, pushSchedulerDisplayMessage]);

  // Hourly calendar selectable
  const scheduleSelectable = [StateMachine.GENERAL_AVAIL, StateMachine.SPECIFIC_AVAIL].includes(flowState);

  // When general calendar slot is selected
  const onSelectGeneralSlot = useCallback(({start, end}) => {
    if (flowState !== StateMachine.GENERAL_AVAIL) {
      return;
    }
    sendMessage({
      type: MessageTypes.TOGGLE_GENERAL_SLOTS,
      day: getDayOfWeek(start),
      from: start,
      to: end,
      eventId: eventId,
      name: name
    });
  }, [eventId, name, flowState, sendMessage]);

  // When hourly calendar slot is selected
  const onSelectSlot = useCallback(({start, end}) => {
    if (flowState !== StateMachine.SPECIFIC_AVAIL) {
      return;
    }
    sendMessage({
      type: MessageTypes.TOGGLE_SLOTS,
      from: start,
      to: end,
      eventId: eventId,
      name: name
    });
  }, [eventId, name, flowState, sendMessage]);

  // Allow specific keypresses in chat input
  const allowKey = useCallback((key) => {
    if (flowState === StateMachine.NAME) {
      const allowedCharacters = /[A-Za-z]/;
      if (!allowedCharacters.test(key)) {
        return false;
      }
    }
    return true;
  }, [flowState]);

  // Date calendar or hourly calendar depending where we are in flow
  const renderWidget = () => {
    if (flowState === StateMachine.SELECT_DATES) {
      return (
        <MonthlyCalendar
          range={range}
          onRangeChanged={onRangeChanged}
          onSubmit={onConfirmRange}
          submittable={!rangeEmpty}
        />
      );
    } else if (flowState === StateMachine.GENERAL_AVAIL) {
      return (
        <GeneralWeeklyCalendar
          timeGrid={timeGrid}
          name={name}
          onSubmit={onConfirmGeneralAvail}
          selectable={scheduleSelectable}
          onSelectSlot={onSelectGeneralSlot}
        />
      );
    } else if (flowState !== StateMachine.LOADING) {
      return (
        <SpecificWeeklyCalendar
          dateRange={range}
          timeGrid={timeGrid}
          setCurrentWeek={setCurrentWeek}
          selectable={scheduleSelectable}
          onSelectSlot={onSelectSlot}
          names={names}
          editingName={name}
          showButtons={flowState === StateMachine.SPECIFIC_AVAIL}
          onSubmit={onFindTimes}
        />
      );
    }
  };

  return (
    <div className='grid-container' style={backgroundStyle}>
      <div className='header'>
        <h1 className='event-title'>{title.toLocaleUpperCase()}</h1>
      </div>
      <div className='chat-section'>
        <Chat
          onSendMessage={onSend}
          messages={displayMessages}
          allowKey={allowKey}
        />
      </div>
      <div className='calendar-section'>
          { renderWidget() }
      </div>
    </div>
  );
}

export default App;

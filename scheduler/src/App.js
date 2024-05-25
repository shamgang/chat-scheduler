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
  Authors,
  GENERAL_AVAIL_KEY
} from './services/MessageService';
import { generateDisplayMessages } from './helpers/DisplayMessages'
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
  const { messages, sendMessage, messageServiceError } = useMessageService();
  if (messageServiceError) {
    throw messageServiceError;
  }
  const [eventStateError, setEventStateError] = useState(null);
  if (eventStateError) {
    throw eventStateError;
  }
  const [numMessagesProcessed, setNumMessagesProcessed] = useState(0);
  const [range, setRange] = useState([new Date(), new Date()]);
  const [rangeEmpty, setRangeEmpty] = useState(true);
  // Time ranges here will be a map of key to 3D time ranges array.
  // Each key will represent a different week or general availability.
  const [timeGrid, setTimeGrid] = useState(null);
  const [flowState, setFlowState] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(lastMonday(new Date()));
  const { eventId } = useParams();
  const [eventState, setEventState] = useState(null); // TODO: this contains some redundant data
  const [name, setName] = useState(null);
  const [names, setNames] = useState(null);
  const navigate = useNavigate();
  // If the first render has no eventId, this is a new event.
  const isNew = useRef(!eventId);

  const backgroundStyle = {
    backgroundImage: `url(${BACKGROUND_IMAGE})`
  };

  // Initialize
  useEffect(() => {
    if (flowState) {
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
          setTimeGrid(loadedEvent.timeGrid);
          setNames(loadedEvent.names);
          setEventState(loadedEvent);
          setFlowState(StateMachine.NAME);
        } catch (error) {
          setEventStateError(error);
        }
      })();
    } else {
      // Rendering a new event
      setFlowState(StateMachine.SELECT_DATES);
    }
  }, [
    flowState,
    eventId,
    setEventState,
    setRange,
    setCurrentWeek,
    setFlowState,
    setTimeGrid,
    setNames,
    setEventStateError
  ]);


  // Take action based on latest messages
  useEffect(() => {
    if (messages.length < 1 || numMessagesProcessed >= messages.length) {
      return;
    }
    for (const msg of messages.slice(numMessagesProcessed)) {
      // Set range if new message is a scheduler range
      if (
        msg.author === Authors.SCHEDULER &&
        msg.type ===  MessageTypes.RANGE
      ) {
        console.log(`Chatbot range change from: ${msg.fromDate} to: ${msg.toDate}`);
        setRange([msg.fromDate, msg.toDate]);
        setRangeEmpty(false);
        setCurrentWeek(lastMonday(msg.fromDate));
      }
      // Set time ranges if messages change and last message is a time range
      if (
        msg.author === Authors.SCHEDULER &&
        msg.type === MessageTypes.TIME_GRID
      ) {
        console.log('Chatbot setting time grid:', msg.timeGrid);
        setTimeGrid(msg.timeGrid);
      }
      setNumMessagesProcessed(n => n+1);
    } 
  }, [
    messages,
    numMessagesProcessed,
    setNumMessagesProcessed,
    setRange,
    setRangeEmpty,
    setCurrentWeek,
    setTimeGrid
  ]);

  const shortRange = range && getDateRangeLengthDays(range[0], range[1]) < 10;

  const onSend = useCallback((input) => {
    // Sending a chat message
    if (flowState === StateMachine.SELECT_DATES) {
      sendMessage({
        type: MessageTypes.DATES,
        author: Authors.USER,
        prompt: input
      });
    } else if (flowState === StateMachine.NAME) {
      const newName = input.trim().toLowerCase();
      sendMessage({
        type: MessageTypes.NAME,
        author: Authors.USER,
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
      } else {
        setFlowState(StateMachine.GENERAL_AVAIL);
      }
    } else if ([StateMachine.GENERAL_AVAIL, StateMachine.SPECIFIC_AVAIL].includes(flowState)) {
      sendMessage({
        type: MessageTypes.TIMES,
        author: Authors.USER,
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
    setName,
    setNames
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
      author: Authors.USER,
      fromDate: range[0],
      toDate: range[1],
      eventId: eventId
    });
    setFlowState(StateMachine.NAME);
    navigate(`/${eventId}`);
  }, [sendMessage, setFlowState, range, navigate]);

  // Button click from weekly calendar - confirming general avail or finding times
  const onConfirmGeneralAvail = useCallback(() => {
    sendMessage({
      type: MessageTypes.CONFIRM,
      author: Authors.USER,
      eventId: eventId,
      name: name
    });
    setFlowState(StateMachine.SPECIFIC_AVAIL);
  }, [eventId, name, setFlowState, sendMessage]);

  const onFindTimes = useCallback(() => {
    alert(findBestTime(timeGrid, names));
  }, [timeGrid, names]);

  // Hourly calendar selectable
  const scheduleSelectable = [StateMachine.GENERAL_AVAIL, StateMachine.SPECIFIC_AVAIL].includes(flowState);

  // When general calendar slot is selected
  const onSelectGeneralSlot = useCallback(({start, end}) => {
    if (flowState !== StateMachine.GENERAL_AVAIL) {
      return;
    }
    sendMessage({
      type: MessageTypes.TOGGLE_GENERAL_SLOTS,
      author: Authors.USER,
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
      author: Authors.USER,
      from: start,
      to: end,
      eventId: eventId,
      name: name
    });
  }, [eventId, name, flowState, sendMessage]);

  // Messages to show in chat
  const displayMessages = generateDisplayMessages(
    messages,
    isNew.current,
    eventState,
    name,
    shortRange
  );

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

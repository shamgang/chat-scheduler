import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLoaderData, useNavigate } from "react-router-dom";
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

export async function loader({ params }) {
  // TODO: keep a state variable so we don't
  // hit the server if it's not a fresh load
  // https://github.com/remix-run/react-router/issues/9324
  if (params.eventId) {
    return {
      eventId: params.eventId,
      eventState: await getEventState(params.eventId)
    }
  }
  return {}
}

const BACKGROUND_IMAGE = getRandomBackgroundImageUrl();

function App() {
  const { messages, sendMessage } = useMessageService();
  const [numMessagesProcessed, setNumMessagesProcessed] = useState(0);
  const [range, setRange] = useState([new Date(), new Date()]);
  // Time ranges here will be a map of key to 3D time ranges array.
  // Each key will represent a different week or general availability.
  const [timeGrid, setTimeGrid] = useState(null);
  const [flowState, setFlowState] = useState(StateMachine.SELECT_DATES);
  const [currentWeek, setCurrentWeek] = useState(lastMonday(new Date()));
  const { eventId, eventState } = useLoaderData();
  const [name, setName] = useState(null);
  const [names, setNames] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const navigate = useNavigate();
  // If the first render has no eventId, this is a new event.
  const isNew = useRef(!eventId);

  const backgroundStyle = {
    backgroundImage: `url(${BACKGROUND_IMAGE})`
  };

  // Populate loaded state if this is an existing event
  useEffect(() => {
    if (eventId) {
      // Rendering an existing event
      if (!isNew.current) {
        // This is a fresh load of an existing event, set state from server
        setRange([eventState.fromDate, eventState.toDate]);
        setCurrentWeek(lastMonday(eventState.fromDate));
        setFlowState(StateMachine.NAME);
        setTimeGrid(eventState.timeGrid);
        setNames(eventState.names);
      }
    }
  }, [eventId, eventState, setRange, setCurrentWeek, setFlowState, setTimeGrid, setNames]);


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
    setCurrentWeek,
    timeGrid,
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
      setName(input);
      let nextNames = [...(names || [])]
      if(!nextNames.includes(newName)) {
        nextNames.push(newName);
      }
      setNames(nextNames);
      setEditingName(newName);
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
    } else if ([StateMachine.GENERAL_AVAIL, StateMachine.SPECIFIC_AVAIL, StateMachine.VIEW_AVAIL].includes(flowState)) {
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
    setNames,
    setEditingName
  ]);

  // When date calendar selection changes
  const onRangeChanged = useCallback((value) => {
    console.log(`Manual range change from: ${value[0]} to: ${value[1]}`);
    setRange(value);
    setCurrentWeek(lastMonday(value[0]));
  }, [setRange, setCurrentWeek]);

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

  const onEdit = useCallback(() => {
    setFlowState(StateMachine.SPECIFIC_AVAIL);
    setEditingName(name);
  }, [name, setFlowState, setEditingName]);

  const onView = useCallback(() => {
    setFlowState(StateMachine.VIEW_AVAIL);
    setEditingName(null);
  }, [setFlowState, setEditingName]);

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
    } else {
      return (
        <SpecificWeeklyCalendar
          dateRange={range}
          timeGrid={timeGrid}
          setCurrentWeek={setCurrentWeek}
          selectable={scheduleSelectable}
          onSelectSlot={onSelectSlot}
          names={names}
          editingName={editingName}
          showButtons={[StateMachine.SPECIFIC_AVAIL, StateMachine.VIEW_AVAIL].includes(flowState)}
          onEdit={onEdit}
          onView={onView}
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

import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLoaderData, useNavigate } from "react-router-dom";
import './App.css';
import Chat from './components/Chat';
import Calendar from './components/Calendar';
import Scheduler from './components/Scheduler';
import { 
  useMessageService,
  MessageTypes,
  Authors,
  GENERAL_AVAIL_KEY
} from './services/MessageService';
import { generateDisplayMessages } from './helpers/DisplayMessages'
import { StateMachine } from './helpers/StateMachine';
import { getEventState } from "./services/StateService";

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

function App() {
  const { messages, sendMessage } = useMessageService();
  const [numMessagesProcessed, setNumMessagesProcessed] = useState(0);
  const [range, setRange] = useState([new Date(), new Date()]);
  // Time ranges here will be a map of key to 3D time ranges array.
  // Each key will represent a different week or general availability.
  const [timeRanges, setTimeRanges] = useState(null);
  const [flowState, setFlowState] = useState(StateMachine.SELECT_DATES);
  const [currentWeek, setCurrentWeek] = useState(null);
  const { eventId, eventState } = useLoaderData();
  const navigate = useNavigate();
  // If the first render has no eventId, this is a new event.
  const isNew = useRef(!eventId);
  // If event has loaded state and general avail is confirmed,
  // we are starting in specific mode.
  const isSpecific = useRef(eventState && eventState.generalAvailConfirmed);

  // Populate loaded state if this is an existing event
  useEffect(() => {
    if (eventId) {
      // Rendering an existing event
      if (!isNew.current) {
        // This is a fresh load of an existing event, set state from server
        setRange([eventState.chosenDates.from, eventState.chosenDates.to]);
        if (eventState.generalAvailConfirmed === true) {
          setFlowState(StateMachine.SPECIFIC_AVAIL);
        } else {
          setFlowState(StateMachine.GENERAL_AVAIL);
        }
        setTimeRanges(eventState.timeRanges);
      }
    }
  }, [eventId, eventState]);



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
      }
      // Set time ranges if messages change and last message is a time range
      if (
        msg.author === Authors.SCHEDULER &&
        msg.type === MessageTypes.TIME_RANGES
      ) {
        console.log(`Chatbot setting time ranges for week ${msg.week}: ${msg.text}`);
        let trs = {...timeRanges}; // shallow-ish copy
        if (!trs) {
          trs = {};
        }
        trs[msg.week] = msg.timeRanges;
        setTimeRanges(trs);
      }
      setNumMessagesProcessed(n => n+1);
    } 
  }, [
    messages,
    numMessagesProcessed,
    setNumMessagesProcessed,
    currentWeek,
    setRange,
    timeRanges,
    setTimeRanges
  ]);

  const onSend = useCallback((input) => {
    // Sending a chat message
    const type = flowState === StateMachine.SELECT_DATES ? MessageTypes.DATES : MessageTypes.TIMES;
    let message = {
      type: type,
      author: Authors.USER,
      prompt: input
    };
    if (type === MessageTypes.TIMES) {
      message.week = flowState === StateMachine.GENERAL_AVAIL ? GENERAL_AVAIL_KEY : currentWeek;
      message.eventId = eventId;
    }
    sendMessage(message);
  }, [eventId, flowState, currentWeek, sendMessage]);

  const onRangeChanged = useCallback((value) => {
    console.log(`Manual range change from: ${value[0]} to: ${value[1]}`);
    setRange(value);
  }, [setRange]);

  const onSubmit = useCallback(() => {
    // Confirming date range
    // Now that date range is confirmed, created a persisted event
    const eventId = uuidv4();
    sendMessage({
      type: MessageTypes.RANGE,
      author: Authors.USER,
      fromDate: range[0],
      toDate: range[1],
      eventId: eventId
    });
    setFlowState(StateMachine.GENERAL_AVAIL);
    navigate(`/${eventId}`);
  }, [sendMessage, setFlowState, range, navigate]);

  const onConfirm = useCallback(() => {
    sendMessage({
      type: MessageTypes.CONFIRM,
      author: Authors.USER,
      eventId: eventId
    });
    if (flowState === StateMachine.GENERAL_AVAIL) {
      setFlowState(StateMachine.SPECIFIC_AVAIL);
    }
  }, [eventId, flowState, setFlowState, sendMessage]);

  const onSelectSlot = useCallback(({start, end}) => {
    sendMessage({
      type: MessageTypes.OPEN,
      author: Authors.USER,
      from: start,
      to: end,
      eventId: eventId
    });
  }, [eventId, sendMessage]);

  const onSelectEvent = useCallback(({ start, end }) => {
    sendMessage({
      type: MessageTypes.CLOSE,
      author: Authors.USER,
      from: start,
      to: end,
      eventId: eventId
    });
  }, [eventId, sendMessage]);

  const displayMessages = generateDisplayMessages(
    messages,
    isNew.current,
    isSpecific.current
  );

  return (
    <div className='grid-container'>
      <div className='chat'>
        <Chat
          onSendMessage={onSend}
          messages={displayMessages}
        />
      </div>
      <div className='calendar-container'>
        <div className='calendar'>
          {
            flowState === StateMachine.SELECT_DATES ?
            <Calendar
              range={range}
              onRangeChanged={onRangeChanged}
              onSubmit={onSubmit}
            /> :
            <Scheduler
              dateRange={range}
              timeRanges={timeRanges}
              onConfirm={onConfirm}
              setCurrentWeek={setCurrentWeek}
              onSelectEvent={onSelectEvent}
              onSelectSlot={onSelectSlot}
            />
          }
        </div>
      </div>
    </div>
  );
}

export default App;

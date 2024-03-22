import { useEffect, useState, useCallback } from 'react';
import './App.css';
import Chat from './components/Chat';
import Calendar from './components/Calendar';
import Scheduler from './components/Scheduler';
import { 
  useMessageService,
  MessageTypes,
  Authors,
  GENERAL_AVAIL_KEY,
  toIsoNoHyphens
} from './services/MessageService';
import { StateMachine } from './helpers/StateMachine';
import { lastMonday } from './helpers/Dates';



function App() {
  const { messages, sendMessage } = useMessageService();
  const [numMessagesProcessed, setNumMessagesProcessed] = useState(0);
  const [range, setRange] = useState([new Date(), new Date()]);
  // Time ranges here will be a map of key to 3D time ranges array.
  // Each key will represent a different week or general availability.
  const [timeRanges, setTimeRanges] = useState(null);
  const [flowState, setFlowState] = useState(StateMachine.SELECT_DATES);
  const [currentWeek, setCurrentWeek] = useState(null);

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
        const key = currentWeek ? toIsoNoHyphens(currentWeek) : GENERAL_AVAIL_KEY;
        console.log(`Chatbot setting time ranges for week ${key}: ${msg.text}`);
        let trs = {...timeRanges}; // shallow-ish copy
        if (!trs) {
          trs = {};
        }
        trs[key] = msg.timeRanges;
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
    setTimeRanges
  ]);

  const onSend = useCallback((input) => {
    // Sending a chat message
    const type = flowState === StateMachine.SELECT_DATES ? MessageTypes.DATES : MessageTypes.TIMES;
    let message = {
      author: Authors.USER,
      type: type,
      text: input
    };
    if (type === MessageTypes.TIMES) {
      message.week = flowState === StateMachine.GENERAL_AVAIL ? null : currentWeek;
    }
    sendMessage(message);
  }, [flowState, currentWeek, sendMessage]);

  const onRangeChanged = useCallback((value) => {
    console.log(`Manual range change from: ${value[0]} to: ${value[1]}`);
    setRange(value);
  }, [setRange]);

  const onSubmit = useCallback(() => {
    // Confirming date range
    sendMessage({
      author: Authors.USER,
      type: MessageTypes.RANGE,
      fromDate: range[0],
      toDate: range[1]
    });
    setFlowState(StateMachine.GENERAL_AVAIL);
  }, [sendMessage, setFlowState, range]);

  const onConfirm = useCallback(() => {
    sendMessage({
      author: Authors.USER,
      type: MessageTypes.CONFIRM
    });
    if (flowState === StateMachine.GENERAL_AVAIL) {
      setCurrentWeek(lastMonday());
      setFlowState(StateMachine.SPECIFIC_AVAIL);
    }
  }, [flowState, setFlowState, sendMessage]);

  const onSelectSlot = useCallback(({start, end}) => {
    sendMessage({
      author: Authors.USER,
      type: MessageTypes.OPEN,
      from: start,
      to: end
    });
  }, [sendMessage]);

  const onSelectEvent = useCallback(({ start, end }) => {
    sendMessage({
      author: Authors.USER,
      type: MessageTypes.CLOSE,
      from: start,
      to: end
    });
  }, [sendMessage]);

  return (
    <div className='grid-container'>
      <div className='chat'>
        <Chat
          onSendMessage={onSend}
          messages={messages}
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

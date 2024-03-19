import { useEffect, useState, useCallback } from 'react';
import './App.css';
import Chat from './components/Chat';
import Calendar from './components/Calendar';
import Scheduler from './components/Scheduler';
import { useMessageService, MessageTypes, Authors, formatTimeRanges } from './services/MessageService';

function App() {
  const { messages, sendMessage } = useMessageService();
  const [range, setRange] = useState([new Date(), new Date()]);
  const [rangeConfirmed, setRangeConfirmed] = useState(false);
  const [timeRanges, setTimeRanges] = useState([[], [], [], [], [], [], []]);

  // Take action based on latest messages
  useEffect(() => {
    if (messages.length < 1) {
      return;
    }
    const lastMsg = messages.slice(-1)[0];
    // Set range if messages change and last message is a scheduler range
    if (
      lastMsg.author === Authors.SCHEDULER &&
      lastMsg.type ===  MessageTypes.RANGE
    ) {
      console.log(`Chatbot range change from: ${lastMsg.fromDate} to: ${lastMsg.toDate}`);
      setRange([lastMsg.fromDate, lastMsg.toDate]);
    }
    if (
      lastMsg.author === Authors.SCHEDULER &&
      lastMsg.type === MessageTypes.TIME_RANGES
    ) {
      console.log(`Chatbot setting time ranges: ${lastMsg.text}`);
      setTimeRanges(lastMsg.timeRanges);
    }
  }, [messages, setRange, setTimeRanges]);

  const onSend = useCallback((input) => {
    // Sending a chat message
    sendMessage({
      author: Authors.USER,
      type: rangeConfirmed ? MessageTypes.TIMES : MessageTypes.DATES,
      text: input
    });
  }, [rangeConfirmed, sendMessage]);

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
    setRangeConfirmed(true);
  }, [sendMessage, setRangeConfirmed, range]);

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
            rangeConfirmed ?
            <Scheduler
              dateRange={range}
              timeRanges={timeRanges}
            /> :
            <Calendar
              range={range}
              onRangeChanged={onRangeChanged}
              onSubmit={onSubmit}
            />
          }
        </div>
      </div>
    </div>
  );
}

export default App;

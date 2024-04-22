import { useCallback, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesRight } from '@fortawesome/free-solid-svg-icons'
import './Chat.css';

function Chat({onSendMessage, messages}) {
  const [input, setInput] = useState('');
  const [hoverSend, setHoverSend] = useState(false);
  const [clickingSend, setClickingSend] = useState(false);
  const messagesRef = useRef(null);

  const sendEnabled = input.length > 0;

  useEffect(() => {
    if (messagesRef.current) {
      const lastMessage = messagesRef.current.lastElementChild;
      if (lastMessage) {
        lastMessage.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [messages]);

  const onInputChange = useCallback((event) => {
    setInput(event.target.value);
  }, [setInput]);

  const onFormSubmit = useCallback((event) => {
    event.preventDefault();
    if (!sendEnabled) {
      return;
    }
    onSendMessage(input);
    setInput('');
  }, [input, sendEnabled, onSendMessage, setInput]);

  return (
    <div className="chat-container">
      <div className="messages-container" ref={messagesRef}>
        {
          messages.map((msg, i) => (
            <div key={`message-${i}`} className={ `message ${msg.fromUser ? 'outgoing': 'incoming' }`}>
              {msg.text}
            </div>
          ))
        }
      </div>
      <form onSubmit={onFormSubmit} className='input-container' id="messageForm">
        <input type="text" value={input} className="message-input" id="messageInput" autoFocus onChange={onInputChange}/>
        <button type="submit" className="send">
          <FontAwesomeIcon
            icon={faAnglesRight}
            className={`send-icon ${sendEnabled ? 'enabled' : 'disabled'} ${clickingSend ? 'clicking' : ''}`}
            beatFade={hoverSend && sendEnabled}
            fade={!hoverSend && sendEnabled}
            onMouseEnter={() => setHoverSend(true)}
            onMouseLeave={() => { setHoverSend(false); setClickingSend(false); }}
            onMouseDown={() => setClickingSend(true)}
            onMouseUp={() => setClickingSend(false)}
            />
        </button>
      </form>
    </div>
  );
}

export default Chat;

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Conversation = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(null);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // add user message immediately
    const userMsg = { chatbot: 'user', message: input };
    setMessages((prev) => [...(prev || []), userMsg]);

    try {
      const res = await axios.post('/api/conversation', {
        initial_message: input,
        turns: 3,
      });

      setMessages((prev) => [...prev, ...res.data.messages]);
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-4 justify-center items-center flex flex-col">
      <div className="chat-window w-11/17 h-[500px] mb-20 relative border rounded-xl px-4 pb-24 overflow-hidden">
        <div ref={messagesRef} className="messages-container overflow-y-auto h-full pr-2">
          <div className="absolute top-0 left-0 w-full h-16 pointer-events-none z-20 bg-gradient-to-b from-base-200 to-[rgba(243,244,246,0)]"></div>

          {!messages && <p>Type a message to start...</p>}

          {messages &&
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat ${
                  msg.chatbot === 'user'
                    ? 'place-self-center'
                    : msg.chatbot === 'a'
                      ? 'chat-start'
                      : 'chat-end'
                }`}
              >
                <div className="chat-bubble">
                  <strong>
                    {msg.chatbot === 'user' ? 'You' : `Chatbot ${msg.chatbot.toUpperCase()}`}:
                  </strong>{' '}
                  {msg.message}
                </div>
              </div>
            ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4 w-full absolute bottom-0 left-0 bg-base-200 border-t rounded-b-xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Conversation starter..."
            className="input input-bordered w-full"
          />
          <button type="submit" className="btn btn-primary">
            Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;

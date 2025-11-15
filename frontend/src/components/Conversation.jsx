import { useState, useEffect, useRef } from 'react';

const Conversation = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(null);
  const messagesRef = useRef(null);
  const [turns, setTurns] = useState(3);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

    setIsLoading(true);
    setError(null);

    const userMsg = { chatbot: 'user', message: input };
    setMessages((prev) => [...(prev || []), userMsg]);

    const conversationData = {
      initial_message: input,
      turns: turns,
    };
    setInput('');

    try {
      // Have to use fetch here to handle the streaming response
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(conversationData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Not authorized. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream finished.');
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Find and process all complete messages in the buffer
        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
          const line = buffer.substring(0, eolIndex).trim();
          buffer = buffer.substring(eolIndex + 2); // Remove processed message

          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.substring(6); // Get the JSON part
              const data = JSON.parse(jsonData);

              if (data.error) throw new Error(`Server error: ${data.error}`);
              if (data.status === 'done') continue; // Just stop processing

              setMessages((prev) => [...prev, data]);
            } catch (e) {
              console.warn('Error parsing JSON from stream:', e, line);
            }
          }
        }
      }
    } catch (err) {
      console.error('Fetch stream error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 justify-center items-center flex flex-col">
      <div className="chat-window lg:w-11/17 w-full h-[500px] mb-20 relative border rounded-xl px-4 pb-24 overflow-hidden">
        <div ref={messagesRef} className="messages-container overflow-y-auto h-full pr-2">
          <div className="absolute top-0 left-0 w-full h-16 pointer-events-none z-20 bg-linear-to-b from-base-200 to-[rgba(243,244,246,0)]"></div>

          {!messages && <p className="mt-10">Type a message to start...</p>}

          {messages &&
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat ${
                  msg.chatbot === 'user'
                    ? 'place-self-center p-4'
                    : msg.chatbot === 'a'
                      ? 'chat-start'
                      : 'chat-end'
                }`}
              >
                <div
                  className={`chat-bubble text-pretty tracking-wide ${msg.chatbot === 'user' && 'chat-bubble-accent'}`}
                >
                  <strong>
                    {msg.chatbot === 'user' ? 'You' : `Chatbot ${msg.chatbot.toUpperCase()}`}:
                  </strong>{' '}
                  {msg.message}
                </div>
              </div>
            ))}

          {isLoading && (
            <div className="flex justify-center p-4">
              <span className="loading loading-dots loading-xl"></span>
            </div>
          )}
          {error && <p className="text-center font-bold text-red-500">Error: {error}</p>}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-4 w-full absolute bottom-0 left-0 bg-base-200 border-t rounded-b-xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Conversation starter..."
            className="input input-bordered w-full"
            disabled={isLoading}
          />
          <label className="input w-auto">
            <span className="label">Turns: </span>
            <input
              type="number"
              value={turns}
              onChange={(e) => setTurns(Number(e.target.value))}
              className="input input-bordered w-20 focus:outline-0"
              min="1"
              max="10"
              disabled={isLoading}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !input}>
            Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;

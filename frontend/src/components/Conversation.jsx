import { useState, useEffect, useRef } from 'react';
import ModelSelection from './ModelSelection.jsx';
import DownloadChatButton from './DownloadChatButton.jsx';

const Conversation = ({ promptA, promptB, onActivate, onClearPrompts, threadId: propThreadId, setThreadId: propSetThreadId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(null);
  const messagesRef = useRef(null);
  const [turns, setTurns] = useState(3);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [threadId, setThreadId] = useState(() => propThreadId ?? crypto.randomUUID());

  useEffect(() => {
    if (propThreadId) setThreadId(propThreadId);
  }, [propThreadId]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleStopConversation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Send the cancel signal
      console.log('--- 🛑 Stream aborted by user ---');
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages(null);
    setError(null);
    const newId = crypto.randomUUID();
    setThreadId(newId);
    if (propSetThreadId) propSetThreadId(newId);
    if (onClearPrompts) onClearPrompts();
    console.log('--- 🗑️ Conversation cleared ---');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    const userMsg = { chatbot: 'user', message: input };
    setMessages((prev) => [...(prev || []), userMsg]);

    const conversationData = {
      initial_message: input,
      turns: turns,
      model: selectedModel,
      system_prompt_a: promptA,
      system_prompt_b: promptB,
      thread_id: threadId,
    };
    setInput('');

    try {
      // Has to be fetch, not axios for streaming
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(conversationData),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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

        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
          const line = buffer.substring(0, eolIndex).trim();
          buffer = buffer.substring(eolIndex + 2);

          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.substring(6);
              const data = JSON.parse(jsonData);

              if (data.type === 'start') {
                setMessages((prev) => [...(prev || []), { chatbot: data.chatbot, message: '' }]);
              } else if (data.type === 'token') {
                setMessages((prev) => {
                  const allButLast = prev.slice(0, -1);
                  const lastMessage = prev[prev.length - 1];
                  const newLastMessage = {
                    ...lastMessage,
                    message: lastMessage.message + data.content,
                  };

                  return [...allButLast, newLastMessage];
                });
              } else if (data.type === 'end') {
                console.log('Message stream complete.');
              } else if (data.type === 'error') {
                throw new Error(`Server error: ${data.content}`);
              }
            } catch (e) {
              console.warn('Error parsing JSON from stream:', e, line);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted as expected.');
        setError(null); // It's not a real error
      } else {
        console.error('Fetch stream error:', err);
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div
      className="justify-center items-center flex flex-col"
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <div className="chat-window w-full h-[80vh] mb-20 relative border rounded-xl px-4 pb-56 sm:pb-24 overflow-hidden">
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
          className="flex flex-col sm:flex-row gap-2 p-4 w-full absolute bottom-0 left-0 bg-base-200 border-t rounded-b-xl"
          onFocus={onActivate}
        >
          <ModelSelection selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
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
          <button
            type={isLoading ? 'button' : 'submit'}
            className={`btn ${isLoading ? 'btn-error' : 'btn-primary'}`}
            disabled={!isLoading && !input}
            onClick={isLoading ? handleStopConversation : undefined}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                STOP
              </>
            ) : (
              'Start'
            )}
          </button>
          {messages && !isLoading && (
            <>
              <button
                type="button"
                className="btn btn-outline btn-secondary"
                onClick={handleClearConversation}
              >
                Clear
              </button>

              <DownloadChatButton threadId={threadId} label="Download conversation" />
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Conversation;

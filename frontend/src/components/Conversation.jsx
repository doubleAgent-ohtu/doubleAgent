import { useState, useEffect, useRef } from 'react';

// --- Alikomponentit (ModelSelection & DownloadChatButton) ---

const ModelSelection = ({ selectedModel, setSelectedModel }) => {
  return (
    <select 
      value={selectedModel} 
      onChange={(e) => setSelectedModel(e.target.value)}
      className="select select-bordered w-full max-w-xs"
    >
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-4-turbo">GPT-4 Turbo</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
    </select>
  );
};

const DownloadChatButton = ({ threadId = "default" }) => {
  const handleDownload = async () => {
    try {
      const API_URL = 'http://localhost:8000'; 
      
      const response = await fetch(`${API_URL}/download-chat/${threadId}`, {
        method: 'GET',
        credentials: 'include', 
      });

      if (!response.ok) {
        throw new Error('Lataus epäonnistui');
      }

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      a.download = `keskustelu_${threadId}.txt`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error(error);
      alert('Keskustelun lataaminen epäonnistui. Varmista että olet kirjautunut sisään tai backend on käynnissä.');
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      className="btn btn-outline btn-sm gap-2"
      title="Lataa keskustelu tekstitiedostona"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      Lataa .txt
    </button>
  );
};

// --- Pääkomponentti ---

const Conversation = ({ promptA, promptB, onActivate, onClearPrompts }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(null);
  const messagesRef = useRef(null);
  const [turns, setTurns] = useState(3);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());

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
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages(null);
    setError(null);
    setThreadId(crypto.randomUUID());
    if (onClearPrompts) onClearPrompts();
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
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
              } else if (data.type === 'error') {
                throw new Error(`Server error: ${data.content}`);
              }
            } catch (e) {
              console.warn(e, line);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError(null);
      } else {
        console.error(err);
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div
      className="justify-center items-center flex flex-col w-full"
      onClick={(e) => {
        if(onActivate) onActivate();
      }}
    >
      <div className="chat-window w-full h-[80vh] mb-20 relative border rounded-xl px-4 pb-56 sm:pb-24 overflow-hidden bg-base-100 shadow-xl">
        <div ref={messagesRef} className="messages-container overflow-y-auto h-full pr-2 pt-4">
          <div className="absolute top-0 left-0 w-full h-16 pointer-events-none z-20 bg-gradient-to-b from-base-100 to-transparent"></div>

          {!messages && <p className="mt-10 text-center opacity-50">Type a message to start...</p>}

          {messages &&
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat ${
                  msg.chatbot === 'user'
                    ? 'place-self-center p-4' // User message centered or special styling
                    : msg.chatbot === 'a'
                      ? 'chat-start'
                      : 'chat-end'
                }`}
              >
                {/* User viestit omalla tyylillä, chatbotit chat-bubbleilla */}
                {msg.chatbot === 'user' ? (
                   <div className="bg-base-200 p-4 rounded-lg max-w-lg mx-auto mb-4">
                     <strong>You:</strong> {msg.message}
                   </div>
                ) : (
                  <div
                    className={`chat-bubble text-pretty tracking-wide ${msg.chatbot === 'a' ? 'chat-bubble-primary' : 'chat-bubble-accent'}`}
                  >
                    <strong>
                      {`Chatbot ${msg.chatbot.toUpperCase()}`}:
                    </strong>{' '}
                    {msg.message}
                  </div>
                )}
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
          className="flex flex-col sm:flex-row gap-2 p-4 w-full absolute bottom-0 left-0 bg-base-200 border-t rounded-b-xl z-30"
          onFocus={onActivate}
        >
          {/* Sisällytetty ModelSelection suoraan */}
          <div className="w-full sm:w-auto">
             <ModelSelection selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Conversation starter..."
            className="input input-bordered w-full"
            disabled={isLoading}
          />
          
          <div className="flex items-center gap-2">
            <span className="label-text whitespace-nowrap">Turns:</span>
            <input
              type="number"
              value={turns}
              onChange={(e) => setTurns(Number(e.target.value))}
              className="input input-bordered w-16 focus:outline-0 px-2"
              min="1"
              max="10"
              disabled={isLoading}
            />
          </div>

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
            <div className="flex gap-2">
              <DownloadChatButton threadId={threadId} />
              <button
                type="button"
                className="btn btn-outline btn-secondary"
                onClick={handleClearConversation}
              >
                Clear
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Conversation;
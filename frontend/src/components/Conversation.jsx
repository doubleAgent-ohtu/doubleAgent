import { useState, useEffect, useRef } from 'react';
import ModelSelection from './ModelSelection.jsx';
import DownloadChatButton from './DownloadChatButton.jsx';

const Conversation = ({
  promptA,
  promptB,
  onActivate,
  onClearPrompts,
  openConversation,
  newChatSignal,
  threadId: propThreadId,
  setThreadId: propSetThreadId,
}) => {
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Load a conversation provided by parent or other components
  useEffect(() => {
    const loadConversation = async () => {
      if (!openConversation) return;

      // If full messages are already present, use them
      if (openConversation.messages && openConversation.messages.length > 0) {
        const mapped = openConversation.messages.map((m) => ({
          chatbot: m.chatbot,
          message: m.message,
        }));
        setMessages(mapped);
        setThreadId(openConversation.thread_id || crypto.randomUUID());
        if (openConversation.model) setSelectedModel(openConversation.model);
        setIsSaved(true);
        return;
      }

      // Otherwise fetch the conversation by id
      try {
        const id = openConversation.id || openConversation;
        console.log('Loading conversation id:', id);
        const res = await fetch(`/api/conversations/${id}`, { credentials: 'include' });
        if (!res.ok) {
          console.warn('Failed to load conversation', res.status);
          return;
        }
        const data = await res.json();
        console.log('Loaded conversation data:', data);
        if (data && data.messages) {
          const mapped = data.messages.map((m) => ({ chatbot: m.chatbot, message: m.message }));
          setMessages(mapped);
        }
        setThreadId(data.thread_id || crypto.randomUUID());
        if (data.model) setSelectedModel(data.model);
        setIsSaved(true);
      } catch (err) {
        console.error('Error loading conversation', err);
      }
    };

    loadConversation();
  }, [openConversation]);

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
    setIsSaved(false);
    setThreadId(crypto.randomUUID());
    try {
      const convId = openConversation && (openConversation.id || openConversation);
      if (convId) {
        try {
          window.dispatchEvent(new CustomEvent('conversation:deleted', { detail: convId }));
        } catch (e) {
          /* ignore */
        }

        (async () => {
          try {
            const res = await fetch(`/api/conversations/${convId}`, {
              method: 'DELETE',
              credentials: 'include',
            });
            if (res.ok) {
              try {
                window.dispatchEvent(new Event('conversations:updated'));
              } catch (e) {
                /* ignore */
              }
              console.log('✅ Conversation deleted from server:', convId);
            } else {
              console.warn('Failed to delete conversation from server', res.status);
              try {
                window.dispatchEvent(new Event('conversations:updated'));
              } catch (e) {
                /* ignore */
              }
            }
          } catch (e) {
            console.warn('Error deleting conversation', e);
            try {
              window.dispatchEvent(new Event('conversations:updated'));
            } catch (ee) {
              /* ignore */
            }
          }
        })();
      }
    } catch (e) {
      console.warn('Error while attempting to delete conversation', e);
    }

    console.log('--- 🗑️ Conversation cleared ---');
  };

  // Clear conversation when parent signals a new chat
  useEffect(() => {
    if (typeof newChatSignal === 'undefined') return;
    handleClearConversation(); 
    onClearPrompts();
  }, [newChatSignal]);

  // Also respond to global new-chat events (dispatched from Menu)
  useEffect(() => {
    const handler = () => {handleClearConversation(); onClearPrompts();}
    try {
      window.addEventListener('new-chat:start', handler);
    } catch (e) {
      // ignore
    }
    return () => {
      try {
        window.removeEventListener('new-chat:start', handler);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleSaveConversation = async () => {
    if (!messages || messages.length === 0) {
      alert('No messages to save');
      return;
    }

    if (isSaved) {
      alert('Conversation already saved');
      return;
    }

    setIsSaving(true);

    // Generate conversation_starter from first user message
    const firstUserMsg = messages.find((m) => m.chatbot === 'user');
    const conversation_starter = firstUserMsg
      ? firstUserMsg.message.substring(0, 50) + (firstUserMsg.message.length > 50 ? '...' : '')
      : 'Conversation';

    const conversationData = {
      conversation_starter,
      thread_id: threadId,
      model: selectedModel,
      system_prompt_a: promptA || null,
      system_prompt_b: promptB || null,
      turns,
      messages: messages.map((msg) => ({
        chatbot: msg.chatbot,
        message: msg.message,
      })),
    };

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Save failed');
      }

      const saved = await response.json();

      setIsSaved(true);
      try {
        window.dispatchEvent(new Event('conversations:updated'));
      } catch (e) {
        /* ignore */
      }
      try {
        window.dispatchEvent(new CustomEvent('conversation:opened', { detail: saved }));
      } catch (e) {
        /* ignore */
      }
      console.log('✅ Conversation saved');
    } catch (err) {
      console.error('Error saving conversation:', err);
      alert(`Error saving conversation: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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
      console.log('Starting POST /api/conversation with payload:', conversationData);
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
              max="20"
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
                className={`btn ${isSaved ? 'btn-success' : 'btn-info'}`}
                onClick={handleSaveConversation}
                disabled={isSaving || isSaved}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Saving...
                  </>
                ) : isSaved ? (
                  '✓ Saved'
                ) : (
                  'Save'
                )}
              </button>
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

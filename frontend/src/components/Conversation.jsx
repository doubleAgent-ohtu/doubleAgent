import { useState, useEffect, useRef, useCallback } from 'react';
import ModelSelection from './ModelSelection.jsx';
import DownloadChatButton from './DownloadChatButton.jsx';
import { useBotConfig } from '../contexts/BotConfigContext';
import axios from 'axios';

const Conversation = ({ onActivate, openConversation, newChatSignal }) => {
  const { promptA, promptB, resetPrompts } = useBotConfig();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(null);
  const messagesRef = useRef(null);
  const [turns, setTurns] = useState(3);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [threadId, setThreadId] = useState(crypto.randomUUID());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const savedMessageCountRef = useRef(null);

  const abortControllerRef = useRef(null);

  // Auto-scroll to bottom when messages change
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
    const controller = new AbortController();

    const loadConversation = async () => {
      if (!openConversation) return;

      try {
        let data = openConversation;
        const hasLocalMessages = data.messages && data.messages.length > 0;

        // Fetch data if we don't have messages locally
        if (!hasLocalMessages) {
          const id = data.id || data;
          console.log('Loading conversation id:', id);

          const res = await axios.get(`/api/conversations/${id}`, {
            withCredentials: true,
            signal: controller.signal,
          });

          data = res.data;
          console.log('Loaded conversation data:', data);
        }

        if (data.messages) {
          setMessages(data.messages.map(({ chatbot, message }) => ({ chatbot, message })));
        }

        setThreadId(data.thread_id || crypto.randomUUID());

        if (data.model) setSelectedModel(data.model);

        setIsSaved(true);
        if (data && data.messages) savedMessageCountRef.current = data.messages.length;
      } catch (err) {
        // Ignore errors caused by us cancelling the request
        if (axios.isCancel(err)) {
          console.log('Previous conversation load canceled');
        } else {
          console.error('Error loading conversation', err);
        }
      }
    };

    loadConversation();

    // 5. Cleanup function: Cancel the request if openConversation changes
    return () => {
      controller.abort();
    };
  }, [openConversation]);

  const handleStopConversation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Send the cancel signal
      console.log('--- 🛑 Stream aborted by user ---');
      setIsLoading(false);
    }
  };

  const openConversationRef = useRef(openConversation);

  useEffect(() => {
    openConversationRef.current = openConversation;
  }, [openConversation]);

  const handleClearConversation = useCallback(
    (deleteRemote = false) => {
      setMessages(null);
      setError(null);
      setIsSaved(false);
      setInput('');
      setThreadId(crypto.randomUUID());
      savedMessageCountRef.current = null;

      const currentConv = openConversationRef.current;
      const convId = currentConv?.id || currentConv;

      if (convId && deleteRemote) {
        window.dispatchEvent(new CustomEvent('conversation:deleted', { detail: convId }));

        // We do NOT await this because we want the screen to wipe instantly.
        axios
          .delete(`/api/conversations/${convId}`, { withCredentials: true })
          .then(() => {
            console.log('✅ Conversation deleted from server:', convId);
          })
          .catch((err) => {
            console.warn('Failed to delete conversation:', err);
          })
          .finally(() => {
            // Even if delete failed
            window.dispatchEvent(new Event('conversations:updated'));
          });
      }

      resetPrompts();

      console.log('--- 🗑️ Conversation cleared ---');
    },
    [resetPrompts],
  );

  useEffect(() => {
    if (typeof newChatSignal === 'undefined') return;
    handleClearConversation();
  }, [newChatSignal, handleClearConversation]);

  useEffect(() => {
    window.addEventListener('new-chat:start', handleClearConversation);
    return () => window.removeEventListener('new-chat:start', handleClearConversation);
  }, [handleClearConversation]);

  const handleSaveConversation = async () => {
    if (!messages?.length) return alert('No messages to save');
    if (isSaved) return alert('Conversation already saved');

    setIsSaving(true);

    try {
      const firstUserMsg = messages.find((m) => m.chatbot === 'user');
      const rawTitle = firstUserMsg?.message || 'Conversation';
      const conversation_starter =
        rawTitle.length > 50 ? `${rawTitle.substring(0, 50)}...` : rawTitle;

      const conversationData = {
        conversation_starter,
        thread_id: threadId,
        model: selectedModel,
        system_prompt_a: promptA?.prompt || null,
        system_prompt_b: promptB?.prompt || null,
        turns,
        messages: messages.map(({ chatbot, message }) => ({ chatbot, message })),
      };

      const response = await axios.post('/api/conversations', conversationData);
      const saved = response.data;

      setIsSaved(true);

      window.dispatchEvent(new Event('conversations:updated'));
      window.dispatchEvent(new CustomEvent('conversation:opened', { detail: saved }));

      console.log('✅ Conversation saved');
    } catch (err) {
      console.error('Error saving conversation:', err);
      const errorMessage = err.response?.data?.detail || err.message;
      alert(`Error saving conversation: ${errorMessage}`);
    } finally {
      setIsSaving(false);
      // ensure saved count matches current messages after save
      savedMessageCountRef.current = messages ? messages.length : 0;
    }
  };

  // Re-enable the Save button when new messages differ from saved count
  useEffect(() => {
    if (!messages) {
      // no messages -> not saved
      setIsSaved(false);
      return;
    }

    const savedCount = savedMessageCountRef.current;
    if (savedCount === null || savedCount === undefined) {
      setIsSaved(false);
      return;
    }

    setIsSaved(messages.length === savedCount);
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    const userMsg = { chatbot: 'user', message: input };
    const newMessages = [...(messages || []), userMsg];
    setMessages(newMessages);

    const conversationData = {
      initial_message: input,
      turns: turns,
      model: selectedModel,
      system_prompt_a: promptA?.prompt || '',
      system_prompt_b: promptB?.prompt || '',
      thread_id: threadId,
      history: newMessages,
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
                onClick={() => handleClearConversation(true)}
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

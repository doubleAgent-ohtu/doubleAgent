import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useBotConfig } from './BotConfigContext';

const ChatSessionContext = createContext(null);

export const ChatSessionProvider = ({ children }) => {
  const { resetPrompts } = useBotConfig();

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationList, setConversationList] = useState([]);
  const [isLoadingConversationList, setIsLoadingConversationList] = useState(false);

  // Load Conversation List
  const refreshConversationList = useCallback(async () => {
    setIsLoadingConversationList(true);
    try {
      const res = await axios.get('/api/conversations', { withCredentials: true });
      const fullData = res.data || [];

      // ⚠️ CRITICAL OPTIMIZATION ⚠️
      // The backend currently sends the full history (heavy).
      // We strip the 'messages' array here to keep the Context lightweight
      // and prevent the Sidebar from holding megabytes of text data.
      // Later lets make backend send only metadata (everything about a convo except messages) for the list endpoint.
      const lightweightList = fullData.map((conv) => {
        // Disable linter because we need to exclude 'messages'
        // eslint-disable-next-line no-unused-vars
        const { messages, ...metaData } = conv;
        return metaData;
      });

      setConversationList(lightweightList);
    } catch (err) {
      console.warn('Failed to load list', err);
    } finally {
      setIsLoadingConversationList(false);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    resetPrompts();
  }, [resetPrompts]);

  const openChat = useCallback((idOrObject) => {
    const id = idOrObject.id || idOrObject;
    setActiveConversationId(id);
  }, []);

  const deleteChat = useCallback(
    async (id) => {
      try {
        // Optimistic update (update UI before server response)
        setConversationList((prev) => prev.filter((c) => c.id !== id));

        if (activeConversationId === id) {
          startNewChat();
        }

        await axios.delete(`/api/conversations/${id}`, { withCredentials: true });
      } catch (err) {
        console.error('Failed to delete chat', err);
        refreshConversationList();
      }
    },
    [activeConversationId, startNewChat, refreshConversationList],
  );

  useEffect(() => {
    refreshConversationList();
  }, [refreshConversationList]);

  return (
    <ChatSessionContext.Provider
      value={{
        activeConversationId,
        conversationList,
        isLoadingConversationList,
        refreshConversationList,
        startNewChat,
        openChat,
        deleteChat,
      }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
};

// Stop linting error for custom hook, keeping hook here for simplicity. (context and hook are related)
// eslint-disable-next-line react-refresh/only-export-components
export const useChatSession = () => {
  const context = useContext(ChatSessionContext);
  if (!context) throw new Error('useChatSession must be used within ChatSessionProvider');
  return context;
};

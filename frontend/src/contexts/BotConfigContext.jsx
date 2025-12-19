import { createContext, useState, useContext, useCallback } from 'react';

const INIT_PROMPT = {
  id: null,
  agent_name: '',
  prompt: '',
  created_at: null,
};

const BotConfigContext = createContext(null);

export const BotConfigProvider = ({ children }) => {
  const [promptA, setPromptA] = useState(INIT_PROMPT);
  const [promptB, setPromptB] = useState(INIT_PROMPT);

  const resetPrompts = useCallback(() => {
    setPromptA(INIT_PROMPT);
    setPromptB(INIT_PROMPT);
  }, []);

  return (
    <BotConfigContext.Provider
      value={{
        promptA,
        setPromptA,
        promptB,
        setPromptB,
        resetPrompts,
        initPrompt: INIT_PROMPT,
      }}
    >
      {children}
    </BotConfigContext.Provider>
  );
};

// Stop linting error for custom hook, keeping hook here for simplicity. (context and hook are related)
// eslint-disable-next-line react-refresh/only-export-components
export const useBotConfig = () => {
  const context = useContext(BotConfigContext);
  if (!context) {
    throw new Error('useBotConfig must be used within a BotConfigProvider');
  }
  return context;
};

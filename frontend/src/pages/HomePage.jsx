import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import BotConfigurator from '../components/BotConfigurator';
import Menu from '../components/Menu';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import Kayttoohje from '../components/Kayttoohje.jsx';
import Conversation from '../components/Conversation.jsx';
import HamburgerMenu from '../components/HamburgerMenu';
import PromptManagerModal from '../components/PromptManagerModal.jsx';
import useAlert from '../components/useAlert.jsx';

const HomePage = () => {
  const [savedPrompts, setSavedPrompts] = useState(null);
  const init_prompt = {
    id: null,
    agent_name: '',
    prompt: '',
    created_at: null,
  };
  const [promptA, setPromptA] = useState(init_prompt);
  const [promptB, setPromptB] = useState(init_prompt);
  const [promptManagerContext, setPromptManagerContext] = useState(null);

  const privacyModalRef = useRef(null);
  const userGuideModalRef = useRef(null);

  const [isConvoActive, setIsConvoActive] = useState(false);
  const [userGuideLanguage, setUserGuideLanguage] = useState('FIN');
  const [privacyLanguage, setPrivacyLanguage] = useState('FIN');
  const [openConversation, setOpenConversation] = useState(null);
  const [newChatSignal, setNewChatSignal] = useState(0);

  const { alertIsVisible, alertText, alertType, showAlert } = useAlert();

  const openPromptManagerModal = (chatbot, promptData, setPrompt, isEditor) => {
    setPromptManagerContext({
      chatbot: chatbot,
      promptData: promptData,
      onSetPrompt: setPrompt,
      isEditor: isEditor,
    });
  };

  const handleClearPrompts = () => {
    setPromptA(init_prompt);
    setPromptB(init_prompt);
  };

  const openUserGuide = () => {
    userGuideModalRef.current.showModal();
  };

  const handleSelectConversation = async (c) => {
    if (!c) return;
    // set the selected conversation immediately; Conversation component will fetch full data if needed
    // also set the system prompts so Conversation uses the same prompts
    setPromptA({ ...init_prompt, prompt: c.system_prompt_a || '' });
    setPromptB({ ...init_prompt, prompt: c.system_prompt_b || '' });
    setOpenConversation(c);
    setIsConvoActive(true);
  };

  const handleNewChat = () => {
    // increment signal so Conversation clears itself
    setOpenConversation(null);
    setNewChatSignal((n) => n + 1);
    setIsConvoActive(true);
  };

  useEffect(() => {
    const loadSavedPrompts = async () => {
      try {
        const { data } = await axios.get('api/get_prompts');
        setSavedPrompts(
          data.reduce((promptMap, prompt) => promptMap.set(prompt.id, prompt), new Map()),
        );
      } catch (err) {
        console.log(err);
      }
    };
    loadSavedPrompts();
  }, []);

  useEffect(() => {}, []);

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail) {
        const c = e.detail;
        setPromptA({ ...init_prompt, prompt: c.system_prompt_a || '' });
        setPromptB({ ...init_prompt, prompt: c.system_prompt_b || '' });
        setOpenConversation(c);
        setIsConvoActive(true);
      }
    };

    window.addEventListener('conversation:opened', handler);
    return () => window.removeEventListener('conversation:opened', handler);
  }, []);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        aria-label="Toggle sidebar"
        aria-controls="sidebar"
      />
      <div className="drawer-content flex flex-col min-h-screen">
        <main
          className="p-8 grow"
          onClick={(e) => {
            setIsConvoActive(false);
            // Close drawer when clicking main content
            const drawer = document.getElementById('my-drawer-4');
            if (drawer) {
              drawer.checked = false;
            }
          }}
        >
          <HamburgerMenu />
          <h1 className="text-center text-4xl font-bold mb-8 tracking-widest">Double Agent AI</h1>
          <div
            className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
              isConvoActive ? 'lg:grid-cols-[1fr_6fr_1fr]' : 'lg:grid-cols-[1fr_1.9fr_1fr]'
            }`}
          >
            <BotConfigurator
              title="Chatbot A"
              prompt={promptA.prompt}
              agentName={promptA.agent_name}
              onEditPrompt={(isEditor) =>
                openPromptManagerModal('A', promptA, setPromptA, isEditor)
              }
              onClearPrompt={() => setPromptA(init_prompt)}
              onActivate={() => setIsConvoActive(false)}
            />

            <div className="order-3 lg:order-2">
              <Conversation
                promptA={promptA.prompt}
                promptB={promptB.prompt}
                onActivate={() => setIsConvoActive(true)}
                onClearPrompts={handleClearPrompts}
                openConversation={openConversation}
                newChatSignal={newChatSignal}
              />
            </div>

            <div className="order-2 lg:order-3">
              <BotConfigurator
                title="Chatbot B"
                prompt={promptB.prompt}
                agentName={promptB.agent_name}
                onEditPrompt={(isEditor) =>
                  openPromptManagerModal('B', promptB, setPromptB, isEditor)
                }
                onClearPrompt={() => setPromptB(init_prompt)}
                onActivate={() => setIsConvoActive(false)}
              />
            </div>
          </div>
        </main>

        <footer className="text-center p-4">
          <button
            className="btn btn-link text-base-content no-underline hover:underline"
            onClick={() => privacyModalRef.current.showModal()}
          >
            Tietosuojaseloste
          </button>
        </footer>
      </div>

      <div className="drawer-side">
        <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
        <Menu
          onOpenUserGuide={openUserGuide}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>

      {promptManagerContext && (
        <PromptManagerModal
          promptManagerContext={promptManagerContext}
          setPromptManagerContext={setPromptManagerContext}
          savedPrompts={savedPrompts}
          setSavedPrompts={setSavedPrompts}
          showAlert={showAlert}
        />
      )}

      {/* User Guide Modal */}
      <dialog ref={userGuideModalRef} id="userguide_modal" className="modal">
        <div className="modal-box w-11/12 max-w-4xl">
          <Kayttoohje onLanguageChange={setUserGuideLanguage} />
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{userGuideLanguage === 'FIN' ? 'Sulje' : 'Close'}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Tietosuojaseloste Modal */}
      <dialog ref={privacyModalRef} id="privacy_modal" className="modal">
        <div className="modal-box w-11/12 max-w-4xl">
          <Tietosuojaseloste onLanguageChange={setPrivacyLanguage} />
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">{privacyLanguage === 'FIN' ? 'Sulje' : 'Close'}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {alertIsVisible && (
        <div className="top-8 left-25 fixed z-100">
          <div
            className={`alert ${alertType == 'success' ? 'alert-success' : alertType == 'error' ? 'alert-error' : 'alert-info'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  alertType == 'success'
                    ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    : alertType == 'error'
                      ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                }
              ></path>
            </svg>
            <span>{alertText}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

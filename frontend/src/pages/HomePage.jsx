import { useState, useRef, useEffect } from 'react';
import BotConfigurator from '../components/BotConfigurator';
import Menu from '../components/Menu';
import PromptEditorModal from '../components/PromptEditorModal';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import Kayttoohje from '../components/Kayttoohje.jsx';
import Conversation from '../components/Conversation.jsx';
import HamburgerMenu from '../components/HamburgerMenu';

const HomePage = () => {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [promptToEdit, setPromptToEdit] = useState(null);

  const promptEditorRef = useRef(null);
  const privacyModalRef = useRef(null);
  const userGuideModalRef = useRef(null);

  const [isConvoActive, setIsConvoActive] = useState(false);
  const [userGuideLanguage, setUserGuideLanguage] = useState('FIN');
  const [privacyLanguage, setPrivacyLanguage] = useState('FIN');
  const [openConversation, setOpenConversation] = useState(null);
  const [newChatSignal, setNewChatSignal] = useState(0);

  const openPromptEditor = (prompt, setPrompt) => {
    setPromptToEdit({ currentPrompt: prompt, onSetPrompt: setPrompt });
  };

  const closePromptEditor = () => {
    if (promptEditorRef.current) {
      promptEditorRef.current.close();
    }
    setPromptToEdit(null);
  };

  const handleClearPrompts = () => {
    setPromptA('');
    setPromptB('');
  };

  const openUserGuide = () => {
    userGuideModalRef.current.showModal();
  };

  const handleSelectConversation = async (c) => {
    if (!c) return;
    // set the selected conversation immediately; Conversation component will fetch full data if needed
    // also set the system prompts so Conversation uses the same prompts
    setPromptA(c.system_prompt_a || '');
    setPromptB(c.system_prompt_b || '');
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
    if (promptToEdit && promptEditorRef.current) {
      promptEditorRef.current.showModal();
    }
  }, [promptToEdit]);

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail) {
        const c = e.detail;
        setPromptA(c.system_prompt_a || '');
        setPromptB(c.system_prompt_b || '');
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
        <main className="p-8 grow" onClick={() => setIsConvoActive(false)}>
          <HamburgerMenu />
          <h1 className="text-center text-4xl font-bold mb-8 tracking-widest">Double Agent AI</h1>
          <div
            className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
              isConvoActive ? 'lg:grid-cols-[1fr_6fr_1fr]' : 'lg:grid-cols-[1fr_1.9fr_1fr]'
            }`}
          >
            <BotConfigurator
              title="Chatbot A"
              prompt={promptA}
              onSetPrompt={() => openPromptEditor(promptA, setPromptA)}
              onActivate={() => setIsConvoActive(false)}
            />

            <div className="order-3 lg:order-2">
              <Conversation
                promptA={promptA}
                promptB={promptB}
                onActivate={() => setIsConvoActive(true)}
                onClearPrompts={handleClearPrompts}
                openConversation={openConversation}
                newChatSignal={newChatSignal}
              />
            </div>

            <div className="order-2 lg:order-3">
              <BotConfigurator
                title="Chatbot B"
                prompt={promptB}
                onSetPrompt={() => openPromptEditor(promptB, setPromptB)}
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
        <Menu onOpenUserGuide={openUserGuide} onSelectConversation={handleSelectConversation} onNewChat={handleNewChat} />
      </div>

      {promptToEdit && (
        <PromptEditorModal
          modalRef={promptEditorRef}
          currentPrompt={promptToEdit.currentPrompt}
          onSetPrompt={promptToEdit.onSetPrompt}
          onClose={closePromptEditor}
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
    </div>
  );
};

export default HomePage;

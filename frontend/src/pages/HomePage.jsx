import { useState, useRef, useEffect } from 'react';
import BotConfigurator from '../components/BotConfigurator';
import Menu from '../components/Menu';
import PromptEditorModal from '../components/PromptEditorModal';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import Kayttoohje from '../components/Kayttoohje.jsx';
import Conversation from '../components/Conversation.jsx';

const HomePage = () => {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [promptToEdit, setPromptToEdit] = useState(null);
  const promptEditorRef = useRef(null);
  const [isConvoActive, setIsConvoActive] = useState(false);
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const privacyModalRef = useRef(null);
  const userGuideModalRef = useRef(null);

  const [userGuideLanguage, setUserGuideLanguage] = useState('FIN');
  const [privacyLanguage, setPrivacyLanguage] = useState('FIN');

  const openPromptEditor = (prompt, setPrompt) => {
    // This will trigger the useEffect.
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

  useEffect(() => {
    if (promptToEdit && promptEditorRef.current) {
      promptEditorRef.current.showModal();
    }
  }, [promptToEdit]);

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
          <h1 className="text-center text-4xl font-bold mb-8 tracking-widest">Double Agent AI</h1>
          <div
            className={`grid grid-cols-1 gap-6 transition-all duration-300 ${
              isConvoActive
                ? 'lg:grid-cols-[1fr_6fr_1fr]' // Convo is active
                : 'lg:grid-cols-[1fr_1.9fr_1fr]' // Default
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
                threadId={threadId}
                setThreadId={setThreadId}
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
          <div className="flex items-center justify-center gap-3">
            <button
              className="btn btn-ghost"
              onClick={() => document.getElementById('privacy_modal').showModal()}
            >
              Tietosuojaseloste
            </button>
          </div>
        </footer>
      </div>

      <div className="drawer-side">
        <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
        <Menu onOpenUserGuide={openUserGuide} />
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

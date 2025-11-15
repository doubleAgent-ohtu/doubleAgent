import { useState, useRef, useEffect } from 'react';
import BotConfigurator from '../components/BotConfigurator';
import Menu from '../components/Menu';
import PromptEditorModal from '../components/PromptEditorModal';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import Conversation from '../components/Conversation.jsx';

const HomePage = () => {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');

  const [promptToEdit, setPromptToEdit] = useState(null);
  const promptEditorRef = useRef(null);

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
        <main className="p-8 grow">
          <h1 className="text-center text-2xl mb-8">Our little chatbots</h1>
          <div className="flex flex-col md:flex-row md:justify-between gap-8">
            <div className="flex-1">
              <BotConfigurator
                title="Chatbot A"
                prompt={promptA}
                onSetPrompt={() => openPromptEditor(promptA, setPromptA)}
              />
            </div>
            <div className="flex-1">
              <BotConfigurator
                title="Chatbot B"
                prompt={promptB}
                onSetPrompt={() => openPromptEditor(promptB, setPromptB)}
              />
            </div>
          </div>
          <Conversation promptA={promptA} promptB={promptB} />
        </main>

        <footer className="text-center p-4">
          <button
            className="btn btn-link"
            onClick={() => document.getElementById('privacy_modal').showModal()}
          >
            Tietosuojaseloste
          </button>
        </footer>
      </div>

      <div className="drawer-side">
        <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
        <Menu />
      </div>

      {promptToEdit && (
        <PromptEditorModal
          modalRef={promptEditorRef}
          currentPrompt={promptToEdit.currentPrompt}
          onSetPrompt={promptToEdit.onSetPrompt}
          onClose={closePromptEditor}
        />
      )}

      <dialog id="privacy_modal" className="modal">
        <div className="modal-box w-11/12 max-w-4xl">
          <Tietosuojaseloste />
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Sulje</button>
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

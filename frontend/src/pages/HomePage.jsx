import { useState, useRef, useEffect } from 'react';
import BotConfigurator from '../components/BotConfigurator';
import Menu from '../components/Menu';
import PromptEditorModal from '../components/PromptEditorModal';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import Kayttoohje from '../components/Kayttoohje.jsx';
import Conversation from '../components/Conversation.jsx';
import HamburgerMenu from '../components/HamburgerMenu';
import ChangePromptModal from '../components/ChangePromptModal.jsx';

const HomePage = () => {
  const [savedPrompts, setSavedPrompts] = useState(new Map());
  const init_prompt = {
    id: null, 
    user: null,
    agent_name:'',
    prompt: '',
    created_at: null
  };
  const [promptA, setPromptA] = useState(init_prompt);
  const [promptB, setPromptB] = useState(init_prompt);

  const [promptToEdit, setPromptToEdit] = useState(null); 
  const [promptToChange, setPromptToChange] = useState(null); 

  const promptEditorRef = useRef(null);
  const changePromptModalRef = useRef(null);



  const privacyModalRef = useRef(null);
  const userGuideModalRef = useRef(null);

  const [isConvoActive, setIsConvoActive] = useState(false);
  const [userGuideLanguage, setUserGuideLanguage] = useState('FIN');
  const [privacyLanguage, setPrivacyLanguage] = useState('FIN');

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

  const openPromptEditor = (prompt, setPrompt, chatbot) => {
    setPromptToEdit({
      promptToEdit: prompt,
      onSetPrompt: setPrompt,
      chatbot: chatbot
    });
  };

  const openChangePromptModal = (setPrompt, chatbot) => {
    setPromptToChange({
      onSetPrompt: setPrompt,
      chatbot: chatbot
    });
  };



  const closePromptEditor = () => {
    if (promptEditorRef.current) {
      promptEditorRef.current.close();
    }
    setPromptToEdit(null);
  };

  const closeChangePromptModal = () => {
    if (changePromptModalRef.current) {
      changePromptModalRef.current.close();
    }
    setPromptToChange(null);
  };


  const handleClearPrompts = () => {
    setPromptA(init_prompt);
    setPromptB(init_prompt);
  };

  const openUserGuide = () => {
    userGuideModalRef.current.showModal();
  };

  useEffect(() => {
    loadSavedPrompts();
  }, []);



  useEffect(() => {
    if (promptToEdit && promptEditorRef.current) {
      promptEditorRef.current.showModal();
    }
  }, [promptToEdit]);

  useEffect(() => {
    if (promptToChange && changePromptModalRef.current) {
      changePromptModalRef.current.showModal();
    }
  }, [promptToChange]);



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
              prompt={promptA.prompt}
              agentName={promptA.agent_name}
              onEditPrompt={() => openPromptEditor(promptA, setPromptA, 'A')}
              onChangePrompt={() => openChangePromptModal(setPromptA, 'A')}
              onActivate={() => setIsConvoActive(false)}
            />

            <div className="order-3 lg:order-2">
              <Conversation
                promptA={promptA.prompt}
                promptB={promptB.prompt}
                onActivate={() => setIsConvoActive(true)}
                onClearPrompts={handleClearPrompts}
              />
            </div>

            <div className="order-2 lg:order-3">
              <BotConfigurator
                title="Chatbot B"
                prompt={promptB.prompt}
                agentName={promptB.agent_name}
                onEditPrompt={() => openPromptEditor(promptB, setPromptB, 'B')}
                onChangePrompt={() => openChangePromptModal(setPromptB, 'B')}
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
        <Menu onOpenUserGuide={openUserGuide} />
      </div>

      {promptToEdit && (
        <PromptEditorModal
          modalRef={promptEditorRef}
          promptToEdit={promptToEdit.promptToEdit}
          onSetPrompt={promptToEdit.onSetPrompt}
          setSavedPrompts={setSavedPrompts}
          chatbot={promptToEdit.chatbot}
          onClose={closePromptEditor}
        />
      )}

      {promptToChange && (
        <ChangePromptModal 
          modalRef={changePromptModalRef}
          savedPrompts={savedPrompts}
          setSavedPrompts={setSavedPrompts}
          onSetPrompt={promptToChange.onSetPrompt}
          chatbot={chatbot}
          onClose={closeChangePromptModal}
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

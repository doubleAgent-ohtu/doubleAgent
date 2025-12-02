import { useState, useRef, useEffect } from 'react';
import BotConfigurator from '../components/BotConfigurator';
import Menu from '../components/Menu';
import PromptEditorModal from '../components/PromptEditorModal';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import Conversation from '../components/Conversation.jsx';
import HamburgerMenu from '../components/HamburgerMenu';
import DownloadChatButton from '../components/DownloadChatButton';

const CONSTANT_THREAD_ID = "current_chat"; 

const HomePage = () => {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [promptToEdit, setPromptToEdit] = useState(null);

  // Ei enää useState threadId:lle!

  const promptEditorRef = useRef(null);
  const privacyModalRef = useRef(null);
  const [isConvoActive, setIsConvoActive] = useState(false);

  const openPromptEditor = (prompt, setPrompt) => {
    setPromptToEdit({ currentPrompt: prompt, onSetPrompt: setPrompt });
  };

  const closePromptEditor = () => {
    if (promptEditorRef.current) promptEditorRef.current.close();
    setPromptToEdit(null);
  };

  const handleClearPrompts = () => {
    setPromptA('');
    setPromptB('');
    // Emme enää generoi uutta ID:tä, vaan käytämme samaa "huonetta".
    // Jos haluat tyhjentää historian backendistä, se vaatisi erillisen "clear history" API-kutsun,
    // mutta pelkkä promptien tyhjennys toimii näin ok.
  };

  useEffect(() => {
    if (promptToEdit && promptEditorRef.current) promptEditorRef.current.showModal();
  }, [promptToEdit]);

  return (
    <div className="drawer lg:drawer-open">
       {/* ... drawer koodit ... */}
      <div className="drawer-content flex flex-col min-h-screen">
        <main className="p-8 grow" onClick={() => setIsConvoActive(false)}>
          <HamburgerMenu />
          <h1 className="text-center text-4xl font-bold mb-8 tracking-widest">Double Agent AI</h1>
          <div className="...">
            
            {/* ... Bot A Configurator ... */}

            <div className="order-3 lg:order-2 flex flex-col gap-4">
              <div className="flex justify-end">
                {/* KÄYTETÄÄN KIINTEÄÄ ID:tä */}
                <DownloadChatButton threadId={CONSTANT_THREAD_ID} />
              </div>

              {/* KÄYTETÄÄN KIINTEÄÄ ID:tä */}
              <Conversation
                promptA={promptA}
                promptB={promptB}
                threadId={CONSTANT_THREAD_ID}
                onActivate={() => setIsConvoActive(true)}
                onClearPrompts={handleClearPrompts}
              />
            </div>

            {/* ... Bot B Configurator ... */}
            
          </div>
        </main>
        {/* ... Footer ... */}
      </div>
      {/* ... Drawer side ... */}
    </div>
  );
};

export default HomePage;
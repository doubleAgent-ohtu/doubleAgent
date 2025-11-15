import { useState, useRef } from 'react';
import Chat from '../components/Chat';
import Menu from '../components/Menu';
import SavePrompt from '../components/SavePrompt';
import Tietosuojaseloste from '../components/Tietosuojaseloste.jsx';
import ModelSelection from '../components/ModelSelection.jsx';
import Conversation from '../components/Conversation.jsx';

const HomePage = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [savePrompt, setSavePrompt] = useState('');
  const svPrmtDialogRef = useRef(null);

  function showSvPrmptDialog(show) {
    show ? svPrmtDialogRef.current.showModal() : svPrmtDialogRef.current.close();
  }

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
              <Chat
                title="Chatbot A"
                threadId="chatbot_a"
                model={selectedModel}
                setSavePrompt={setSavePrompt}
                showSvPrmptDialog={showSvPrmptDialog}
              />
            </div>
            <ModelSelection selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
            <div className="flex-1">
              <Chat
                title="Chatbot B"
                threadId="chatbot_b"
                model={selectedModel}
                setSavePrompt={setSavePrompt}
                showSvPrmptDialog={showSvPrmptDialog}
              />
            </div>
          </div>
          <SavePrompt
            savePrompt={savePrompt}
            setSavePrompt={setSavePrompt}
            svPrmtDialogRef={svPrmtDialogRef}
            showSvPrmptDialog={showSvPrmptDialog}
          />
          <Conversation />
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

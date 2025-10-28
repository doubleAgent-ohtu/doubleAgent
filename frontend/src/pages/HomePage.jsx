import { useState } from 'react';
import Chat from '../components/Chat';
import Menu from '../components/Menu';
import SavePrompt from '../components/SavePrompt';

const HomePage = () => {
  const [savePrompt, setSavePrompt] = useState('');

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-4"
        type="checkbox"
        className="drawer-toggle"
        aria-label="Toggle sidebar"
        aria-controls="sidebar"
      />
      <div className="drawer-content">
        <main className="p-8">
          <h1 className="text-center text-2xl mb-8">Our little chatbots</h1>
          <div className="flex flex-col md:flex-row md:justify-between gap-8">
            <Chat title="Chatbot A" threadId="chatbot_a" setSavePrompt={setSavePrompt} />
            <Chat title="Chatbot B" threadId="chatbot_b" setSavePrompt={setSavePrompt} />
          </div>
        <SavePrompt savePrompt={savePrompt} setSavePrompt={setSavePrompt} />
        </main>
      </div>

      <div className="drawer-side">
        <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
        <Menu />
      </div>
    </div>
  );
};

export default HomePage;

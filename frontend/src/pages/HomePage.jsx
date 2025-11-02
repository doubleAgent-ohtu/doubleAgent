import Chat from '../components/Chat';
import Menu from '../components/Menu';
import { useState } from 'react';

const HomePage = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

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
          <div className="mb-4">
            <label htmlFor="model-select" className="block mb-2">Choose Model:</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="gpt-4o-mini">GPT-4o-mini</option>
              <option value="gpt-5">GPT-5</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between gap-8">
            <Chat title="Chatbot A" threadId="chatbot_a" model={selectedModel} />
            <Chat title="Chatbot B" threadId="chatbot_b" model={selectedModel} />
          </div>
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

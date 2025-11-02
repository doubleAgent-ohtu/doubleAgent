import axios from 'axios';
import { useState } from 'react';

const SavePrompt = ({ savePrompt, setSavePrompt, svPrmtDialogRef, showSvPrmptDialog }) => {
  const [agentName, setAgentName] = useState('');

  const closeSavePromptModal = () => {
    setAgentName('');
    showSvPrmptDialog(false);
  };

  const handleSavePrompt = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/save_prompt', {
        user: '', // user retrieved at the backend
        agent_name: agentName,
        prompt: savePrompt,
      });
      console.log(res.data);
      closeSavePromptModal();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <dialog ref={svPrmtDialogRef} className="modal">
        <form method="dialog" className="modal-box flex flex-col gap-4" onSubmit={handleSavePrompt}>
          <div>
            <label htmlFor="savePromptAgentName" className="label">
              <span className="label-text">The agent name</span>
            </label>
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              maxLength={50}
              id="savePromptAgentName"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label htmlFor="savePromptText" className="label">
              <span className="label-text">The prompt</span>
            </label>
            <textarea
              value={savePrompt}
              onChange={(e) => setSavePrompt(e.target.value)}
              maxLength={4000}
              required
              id="savePromptText"
              className="textarea textarea-bordered w-full h-40"
            />
          </div>
          <div className="modal-action justify-end">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" onClick={closeSavePromptModal} className="btn btn-ghost">
              Close
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

export default SavePrompt;

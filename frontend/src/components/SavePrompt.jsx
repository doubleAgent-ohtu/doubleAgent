import axios from 'axios';
import { useState } from 'react';


const SavePrompt = ({ savePrompt, setSavePrompt }) => {
  const [agentName, setAgentName] = useState("");

  const closeSavePromptModal = () => {
    setAgentName('');
    document.getElementById("savePromptModal").close();
  };

  const handleSavePrompt = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/save_prompt", {
        prompt: savePrompt,
        agent_name: agentName
      })
      console.log(res.data);
    } catch (err) {
        console.log(err);
    }
  };

  return (
    <div>
      <dialog id="savePromptModal" className="modal">
        <div className="modal-box" flex flex-col>
          <div>
            <label htmlFor="savePromptAgentName" className="label">
              The agent name
            </label>
            <input 
             value={agentName}
             onChange={(e) => setAgentName(e.target.value)}
             maxLength={50}
             id="savePromptAgentName"
             className="input"
            />
          </div>
          <div>
            <label htmlFor="savePromptText" className="label">
              The prompt
            </label>
            <textarea
             value={savePrompt}
             onChange={(e) => setSavePrompt(e.target.value)}
             maxLength={4000}
             required
             id="savePromptText"
             className="textarea"
            />
          </div>
          <div>
            <button onClick={handleSavePrompt} className="btn btn-primary">
              Save
            </button>
            <button onClick={closeSavePromptModal} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default SavePrompt;

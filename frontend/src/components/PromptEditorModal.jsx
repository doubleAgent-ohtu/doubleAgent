import axios from 'axios';
import { useState, useEffect } from 'react';

const PromptEditorModal = ({ modalRef, promptToEdit, onSetPrompt, setSavedPrompts, chatbot, onClose }) => {
  const [text, setText] = useState(promptToEdit.prompt);
  const [agentName, setAgentName] = useState(promptToEdit.agent_name);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setText(currentPrompt.prompt);
  }, [currentPrompt]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const data = {agent_name: agentName, prompt: text};
      let prompt = null;

      // A new prompt is created if id is null
      if (promptToEdit.id) {
        prompt = await axios.put(`/api/update_prompt/${promptToEdit.id}`, data).data;
      } else {
        prompt = await axios.post('api/save_prompt', data).data;
      }
      onSetPrompt(prompt);
      setSavedPrompts((prev) => new Map(prev.set(prompt.id, prompt)));
      onClose();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box flex flex-col gap-4">
        <h3 className="font-bold text-lg">Set Prompt {chatbot}</h3>

        <div>
          <label htmlFor="savePromptAgentName" className="label">
            <span className="label-text">Agent Name</span>
          </label>
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            maxLength={50}
            id="savePromptAgentName"
            className="input input-bordered w-full"
            placeholder="My Custom Agent..."
          />
        </div>

        <div>
          <label htmlFor="promptText" className="label">
            <span className="label-text">System Prompt</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={15000}
            required
            id="promptText"
            className="textarea textarea-bordered w-full h-40"
          />
        </div>

        <div className="modal-action justify-between">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Click backdrop to close */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          Close
        </button>
      </form>
    </dialog>
  );
};

export default PromptEditorModal;

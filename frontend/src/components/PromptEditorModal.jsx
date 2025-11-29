import axios from 'axios';
import { useState, useEffect } from 'react';
import SelectPrompt from './PromptSelection';

const PromptEditorModal = ({
  modalRef,
  currentPrompt,
  onSetPrompt,
  onClose,
  savedPrompts,
  setSavedPrompts,
}) => {
  const [text, setText] = useState(currentPrompt);
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    setText(currentPrompt);
  }, [currentPrompt]);

  const handleSet = () => {
    onSetPrompt(text);
    onClose();
  };

  const handleSaveToDB = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/save_prompt', {
        agent_name: agentName || 'Unnamed Agent',
        prompt: text,
      });
      const new_prompt = res.data;
      setSavedPrompts((prev) => new Map(prev.set(new_prompt.id, new_prompt)));
      handleSet();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box flex flex-col gap-4">
        <h3 className="font-bold text-lg">Set Prompt</h3>
        <div>
          <label htmlFor="promptText" className="label">
            <span className="label-text">System Prompt</span>
          </label>
          <SelectPrompt savedPrompts={savedPrompts} setText={setText} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={15000}
            required
            id="promptText"
            className="textarea textarea-bordered w-full h-40"
          />
        </div>

        <div className="divider">Save Prompt (Optional)</div>

        <div>
          <label htmlFor="savePromptAgentName" className="label">
            <span className="label-text">Agent Name (to save)</span>
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

        <div className="modal-action justify-between">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={handleSet} className="btn">
              Set
            </button>
            <button type="button" onClick={handleSaveToDB} className="btn btn-primary">
              Set & Save
            </button>
          </div>
        </div>
      </div>

      {/* Click backdrop to close */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
};

export default PromptEditorModal;

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';


const PromptManagerModal = ({ promptManagerContext, setPromptManagerContext, savedPrompts, setSavedPrompts }) => {
  const modalRef = useRef(null);

  const closeModal = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
    setPromptManagerContext(null);
  };

  useEffect(() => {
    if (promptManagerContext && modalRef.current) {
      modalRef.current.showModal();
    }
  }, [promptManagerContext]);
    
  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box flex flex-col gap-4 w-11/12 max-w-5xl h-3/4">
        <div className="modal-action">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={closeModal}
          >
            x
          </button>
        </div>

        {promptManagerContext && (
          promptManagerContext.isEditor ? (
            <PromptEditor 
              promptData={promptManagerContext.promptData}
              onSetPrompt={promptManagerContext.onSetPrompt}
              setSavedPrompts={setSavedPrompts}
              chatbot={promptManagerContext.chatbot}
              onClose={closeModal}
            /> 
          ) : (
            <PromptMenu 
              onSetPrompt={promptManagerContext.onSetPrompt}
              setPromptManagerContext={setPromptManagerContext}
              savedPrompts={savedPrompts}
              setSavedPrompts={setSavedPrompts}
              chatbot={promptManagerContext.chatbot}
              onClose={closeModal}
            /> 
          )
        )}
      </div>
  
      {/* Click backdrop to close */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={closeModal}>
          Close
        </button>
      </form>
    </dialog>
  );
};


const PromptEditor = ({ promptData, onSetPrompt, setSavedPrompts, chatbot, onClose }) => {
  const [text, setText] = useState(promptData.prompt);
  const [agentName, setAgentName] = useState(promptData.agent_name);

  const handleSaveSet = async () => {
    try {
      const data = {agent_name: agentName, prompt: text};
      let res = promptData.id ? await axios.put(`api/update_prompt/${promptData.id}`, data)
                              : await axios.post('api/save_prompt', data);
      const prompt = res.data;
      onSetPrompt(prompt);
      onClose();
      setSavedPrompts((prev) => new Map(prev.set(prompt.id, prompt)));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
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
          required
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
          id="promptText"
          className="textarea textarea-bordered w-full h-40"
          required
        />
      </div>
      <div className="modal-action">
        <button type="button" onClick={() => handleSaveSet()} className="btn btn-primary">
          Save
        </button>
      </div>
    </div>
  );
};


const PromptMenu = ({ onSetPrompt, setPromptManagerContext, savedPrompts, setSavedPrompts, chatbot, onClose }) => {

  const changeToPromptEditor = (
    promptData = {id: null, agent_name: '', prompt: '', created_at: null}
  ) => {
    setPromptManagerContext({
      chatbot: chatbot,
      promptData: promptData,
      onSetPrompt: onSetPrompt,
      isEditor: true
    });
  };

  const deletePrompt = async (id, agentName) => {
    let conf = confirm(`Are you sure you want to delete '${agentName}'?`)
    if (conf) {
      try {
        await axios.delete(`api/delete_prompt/${id}`);
        savedPrompts.delete(id);
        setSavedPrompts((prev) => new Map(prev));
      } catch (err) {
        console.log(err);
      }
    }
  };

  const onSelectPrompt = (prompt) => {
    onSetPrompt(prompt);
    onClose();
  };

  return (
    <div>
      <h3 className="font-bold text-lg">My prompts</h3>
      <div className="modal-action">
        <button onClick={() => changeToPromptEditor()}>
          Add new prompt
        </button>
      </div>
      <div>
        {savedPrompts && (
          <ul className="menu bg-base-200 w-full">
            {Array.from(savedPrompts, ([id, prompt]) => (
              <li key={id} className="flex flex-row">
                <a onClick={() => onSelectPrompt(prompt)} className="">
                  {prompt.agent_name}
                </a>
                <button onClick={() => changeToPromptEditor(prompt)} className="">
                  Edit
                </button>
                <button onClick={() => deletePrompt(id, prompt.agent_name)} className="">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


export default PromptManagerModal;

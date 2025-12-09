import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

const PromptManagerModal = ({
  promptManagerContext,
  setPromptManagerContext,
  savedPrompts,
  setSavedPrompts,
  showAlert,
}) => {
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
      <div className="modal-box flex flex-col w-15/16 max-w-7xl h-3/4 p-8">
        <div className="modal-action">
          <button
            className="btn btn-ghost btn-sm absolute right-4 top-4 text-xl"
            onClick={closeModal}
          >
            <MaterialSymbolsCloseRounded />
          </button>
        </div>

        {promptManagerContext &&
          (promptManagerContext.isEditor ? (
            <PromptEditor
              promptData={promptManagerContext.promptData}
              onSetPrompt={promptManagerContext.onSetPrompt}
              setSavedPrompts={setSavedPrompts}
              chatbot={promptManagerContext.chatbot}
              onClose={closeModal}
              showAlert={showAlert}
            />
          ) : (
            <PromptMenu
              selected={promptManagerContext.promptData.id}
              onSetPrompt={promptManagerContext.onSetPrompt}
              setPromptManagerContext={setPromptManagerContext}
              savedPrompts={savedPrompts}
              setSavedPrompts={setSavedPrompts}
              chatbot={promptManagerContext.chatbot}
              onClose={closeModal}
              showAlert={showAlert}
            />
          ))}
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

const PromptEditor = ({
  promptData,
  onSetPrompt,
  setSavedPrompts,
  chatbot,
  onClose,
  showAlert,
}) => {
  const [text, setText] = useState(promptData.prompt);
  const [agentName, setAgentName] = useState(promptData.agent_name);
  const [saveIsLoading, setSaveIsLoading] = useState(false);

  const handleSaveSet = async () => {
    setSaveIsLoading(true);
    try {
      const data = { agent_name: agentName, prompt: text };
      let res = promptData.id
        ? await axios.put(`api/update_prompt/${promptData.id}`, data)
        : await axios.post('api/save_prompt', data);
      const prompt = res.data;

      onSetPrompt(prompt);
      setSavedPrompts((prev) => new Map(prev.set(prompt.id, prompt)));
      onClose();
      showAlert(`Prompt ${promptData.id ? 'updated' : 'created'} and set`, 'success');
    } catch (err) {
      console.log(err);
      showAlert(
        `An error occured. Another prompt may have already been saved as '${agentName}'. Make sure you have filled all fields.`,
        'error',
      );
    } finally {
      setSaveIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="m-2">
        <h3 className="font-bold text-xl">Set Prompt {chatbot}</h3>
      </div>
      <div className="m-2">
        <label htmlFor="savePromptAgentName" className="label mb-1">
          <span className="label-text">Agent Name</span>
        </label>
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          maxLength={50}
          minLength={1}
          id="savePromptAgentName"
          className="input input-bordered w-full"
          placeholder="My Custom Agent..."
          required
          disabled={saveIsLoading}
        />
      </div>
      <div className="mx-2 mt-2">
        <label htmlFor="promptText" className="label mb-2">
          <span className="label-text">System Prompt</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={15000}
          minLength={1}
          id="promptText"
          className="textarea textarea-bordered w-full h-40"
          placeholder="My Custom Prompt..."
          required
          disabled={saveIsLoading}
        />
      </div>
      <div className="modal-action mt-1">
        <button
          type="button"
          onClick={handleSaveSet}
          className="btn mr-1"
          disabled={saveIsLoading}
        >
          {saveIsLoading ? (
            <>
              Saving<span className="loading loading-spinner loading-xs"></span>
            </>
          ) : (
            <>Save</>
          )}
        </button>
        <button onClick={onClose} className="btn mr-2">
          Cancel
        </button>
      </div>
    </div>
  );
};

const PromptMenu = ({
  selected,
  onSetPrompt,
  setPromptManagerContext,
  savedPrompts,
  setSavedPrompts,
  chatbot,
  onClose,
  showAlert,
}) => {
  const [delIsLoading, setDelIsLoading] = useState(false);

  const changeToPromptEditor = (
    promptData = { id: null, agent_name: '', prompt: '', created_at: null },
  ) => {
    setPromptManagerContext({
      chatbot: chatbot,
      promptData: promptData,
      onSetPrompt: onSetPrompt,
      isEditor: true,
    });
  };

  const deletePrompt = async (id, agentName) => {
    let conf = confirm(`Are you sure you want to delete '${agentName}'?`);
    if (conf) {
      setDelIsLoading(id);
      try {
        await axios.delete(`api/delete_prompt/${id}`);
        savedPrompts.delete(id);
        setSavedPrompts((prev) => new Map(prev));
        showAlert(`'${agentName} deleted'`, 'success');
      } catch (err) {
        console.log(err);
        showAlert('Error occured while deleting', 'error');
      } finally {
        setDelIsLoading(false);
      }
    }
  };

  const onSelectPrompt = (prompt) => {
    onSetPrompt(prompt);
    onClose();
  };

  return (
    <div>
      <div className="m-2">
        <h3 className="text-xl">My prompts</h3>
      </div>
      <div className="modal-action my-5 p-1 size-fit">
        <button onClick={() => changeToPromptEditor()} className="btn">
          Add new prompt
        </button>
      </div>
      <div>
        {savedPrompts &&
          (savedPrompts.size ? (
            <ul className="flex flex-col w-full dark">
              {Array.from(savedPrompts, ([id, prompt]) => (
                <>
                  <li
                    key={id}
                    className={`flex flex-row items-center w-full p-2 rounded-xl ${selected == id && 'bg-base-200'} hover:bg-base-200 hover:cursor-pointer`}
                    onClick={() => onSelectPrompt(prompt)}
                  >
                    <p className='ml-1'>{prompt.agent_name}</p>
                    <div className='ml-auto'>
                      <button
                        onClick={(e) => {e.stopPropagation(); changeToPromptEditor(prompt);}}
                        className="btn btn-ghost rounded-xl"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {e.stopPropagation(); deletePrompt(id, prompt.agent_name);}}
                        className="btn btn-ghost rounded-xl"
                      >
                        {delIsLoading == id ? (
                          <>Deleting<span className="loading loading-spinner loading-xs"></span></>
                        ) : (
                          <>Delete</>
                        )}
                      </button>
                    </div>
                  </li>
                  <hr className="my-2 text-base-300 dark:text-white" />
                </>
              ))}
            </ul>
          ) : (
            <p className="italic text-pretty tracking-wide opacity-80 text-sm">No saved prompts</p>
        ))}
      </div>
    </div>
  );
};

const MaterialSymbolsCloseRounded = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}
      <path
        fill="currentColor"
        d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
      />
    </svg>
  );
};

export default PromptManagerModal;

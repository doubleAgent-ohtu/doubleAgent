const BotConfigurator = ({ title, prompt, agentName, onEditPrompt, onChangePrompt, onActivate }) => {
  return (
    <div
      className="p-4 rounded-lg border bg-base-100 flex flex-col h-[50vh] lg:h-[70vh]"
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <h2 className="text-2xl font-bold mb-4 shrink-0 text-center tracking-wider">{title}</h2>

      <div className="mb-2 text-base-content/70 shrink-0">
        <b>Current prompt:</b>
        <h3>{agentName}</h3>
      </div>

      <div className="grow min-h-0 mb-4">
        <div className="h-full overflow-y-auto whitespace-pre-wrap p-2">
          <p className="italic text-pretty tracking-wide opacity-80 text-sm">
            {prompt || 'No prompt set'}
          </p>
        </div>
      </div>
      <div>
        <button
          onClick={onChangePrompt}
          onFocus={onActivate}
          className={`btn btn-primary shrink-0 ${prompt && 'btn-soft'}`}
        >
          {prompt ? 'Change Prompt' : 'Set Prompt'}
        </button>

        {prompt && (
          <>
            <button onClick={onEditPrompt}>
              Edit Prompt
            </button>
            <button>
              Clear Prompt
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BotConfigurator;

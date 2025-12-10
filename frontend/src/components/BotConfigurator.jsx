const BotConfigurator = ({ title, prompt, agentName, onEditPrompt, onClearPrompt, onActivate }) => {
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
        <h3 className="mt-2 ml-2">{agentName}</h3>
      </div>

      <div className="grow min-h-0 mb-4">
        <div className="h-full overflow-y-auto whitespace-pre-wrap p-2">
          <p className="italic text-pretty tracking-wide opacity-80 text-sm">
            {prompt || 'No prompt set'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => onEditPrompt(false)}
          onFocus={onActivate}
          className={`btn btn-primary shrink-0 ${prompt && 'btn-soft'}`}
        >
          <LucideMenu />
          {prompt ? 'Change Prompt' : 'Set Prompt'}
        </button>

        {prompt && (
          <div className="flex gap-2">
            <button onClick={() => onEditPrompt(true)} className="btn btn-primary">
              <LucidePencilLine />
              Edit
            </button>
            <button onClick={onClearPrompt} className="btn btn-primary">
              <LucideBrushCleaning />
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Icons
const LucideMenu = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 5h16M4 12h16M4 19h16"
      />
    </svg>
  );
};
export const LucidePencilLine = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 21h8M15 5l4 4m2.174-2.188a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      />
    </svg>
  );
};
const LucideBrushCleaning = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m16 22l-1-4m4-4.01a1 1 0 0 0 1-1V12a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v.99a1 1 0 0 0 1 1M5 14h14l1.973 6.767A1 1 0 0 1 20 22H4a1 1 0 0 1-.973-1.233zm3 8l1-4"
      />
    </svg>
  );
};

export default BotConfigurator;

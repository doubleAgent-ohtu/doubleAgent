const BotConfigurator = ({ title, prompt, onSetPrompt }) => {
  return (
    <div className="flex-1 p-4 rounded-lg border bg-base-100">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="mb-4 text-base-content/70 h-16">
        <b>Current prompt:</b>
        <p className="line-clamp-2 italic opacity-80">{prompt || 'No prompt set'}</p>
      </div>
      <button onClick={onSetPrompt} className="btn btn-primary">
        Set Prompt
      </button>
    </div>
  );
};

export default BotConfigurator;

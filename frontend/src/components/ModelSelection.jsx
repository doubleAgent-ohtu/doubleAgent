const ModelSelection = ({ selectedModel, setSelectedModel }) => {
  return (
    <div className="flex-1 text-center">
      <label htmlFor="model-select" className="block mb-2 text-sm font-medium">
        Model:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="select select-bordered w-40 p-1 text-sm rounded-md"
      >
        <option value="gpt-4o">GPT-4o</option>
        <option value="gpt-4o-mini">GPT-4o-mini</option>
        <option value="gpt-4.1">GPT-4.1</option>
        <option value="gpt-5">GPT-5</option>
      </select>
    </div>
  );
};

export default ModelSelection;

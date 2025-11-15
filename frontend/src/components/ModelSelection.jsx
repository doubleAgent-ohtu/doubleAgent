const ModelSelection = ({ selectedModel, setSelectedModel }) => {
  return (
    <label className="select form-control">
      <span className="label">Model:</span>

      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="select select-bordered"
      >
        <option value="gpt-4o">GPT-4o</option>
        <option value="gpt-4o-mini">GPT-4o-mini</option>
        <option value="gpt-4.1">GPT-4.1</option>
        <option value="gpt-5">GPT-5</option>
      </select>
    </label>
  );
};

export default ModelSelection;

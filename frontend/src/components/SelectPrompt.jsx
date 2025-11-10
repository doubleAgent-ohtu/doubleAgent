import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

const SelectPrompt = ({ chatbot, setPromptInput }) => {
  const [prompts, setPrompts] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [morePrompts, setMorePrompts] = useState(true);

  const loadPrompts = async (query, offset, limit) => {
    if (isLoading || !morePrompts) {
      return;
    }
    setIsLoading(true);

    try {
      const res = await axios.get(
        `api/get_user_prompts/?query=${query}&offset=${offset}&limit=${limit}`
      );
      const data = res.data.map(
        prompt => ({value: prompt.prompt, label: prompt.agent_name})
      );

      if (data.length < limit) {
        setMorePrompts(false);
      }
      if (offset > 0) {
        setPrompts((prev) => [...prev, ...data]);
      } else {
        setPrompts(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt) => {
    if (prompt) {
      setPromptInput(prompt.value);
      setSelectedAgent(prompt.agent_name);
    }
  }

  useEffect(() => {loadPrompts('', 0, 25)}, []);

  return (
    <div>
      <button>
        <h3>Prompt {chatbot}</h3>
    </button>
      <div>
        <Select 
         value={selectedAgent}
         options={prompts}
         onChange={handlePromptSelect}
         onMenuScrollToBottom={() => loadPrompts('', prompts.length, 25)}
         isSearchable={false}
         isLoading={isLoading}
         placeholder="Select prompt"
         styles={{
          option: (provided, state) => ({
            ...provided,
            color: 'black'
          })
         }}
        />
      </div>
    </div>
  )
};

export default SelectPrompt;
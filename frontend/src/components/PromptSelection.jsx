import { useState, useEffect } from 'react';
import axios from 'axios';
import Select, { createFilter } from 'react-select';


const SelectPrompt = ({ chatbot, setPromptInput }) => {
  const [prompts, setPrompts] = useState({});
  const [promptOptions, setPromptOptions] = useState([]);

  const loadPrompts = async () => {
    try {
      const res = await axios.get(`api/get_all_user_prompts`);

      const promptData = {};
      for (const prompt of res.data) {
        promptData[prompt.id] = prompt;
      }
      setPrompts(promptData);

      setPromptOptions(
        res.data.map(
          prompt => ({value: prompt.id, label: prompt.agent_name,})
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handlePromptSelect = (option) => {
    if (option) {
      const promptId = option.value;
      const promptText = prompts[promptId].prompt;
      setPromptInput(promptText);
    }
  }

  useEffect(() => {loadPrompts()}, []);

  return (
    <div>
      <h3>Prompt {chatbot}</h3>
      <div>
        <Select 
         options={promptOptions}
         onChange={handlePromptSelect}
         isClearable
         placeholder="Select prompt"
         noOptionsMessage="No saved prompts."
         filterOption={createFilter({
           ignoreCase: true,
           ignoreAccents: true,
           matchFrom: 'any',
           stringify: option => `${option.label}`,
           trim: true,
         })}
         styles={customStyles}
        />
      </div>
    </div>
  )
};

const customStyles = {
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    color: 'black',
    backgroundColor: isSelected ? '#b4b4b4' : isFocused ? '#f0f0f0' : 'white',
  }),
};

export default SelectPrompt;
import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';


const SelectPrompt = ({ chatbot, setPromptInput }) => {
  const [promptOptions, setPromptOptions] = useState([]);

  const loadPrompts = async () => {
    try {
      const res = await axios.get(`api/get_all_user_prompts`);
      setPromptOptions(
        res.data.map(
          (prompt, i) => ({value: prompt.prompt, label: prompt.agent_name})
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {loadPrompts()}, []);

  return (
    <div>
      <h3>Prompt {chatbot}</h3>
      <div>
        <Select 
         options={promptOptions}
         onChange={(selectedPrompt) => {
          if (selectedPrompt) setPromptInput(selectedPrompt.value)
         }}
         isClearable
         placeholder="Select prompt"
         styles={customStyles}
        />
      </div>
    </div>
  )
};

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    color: 'black',
  }),
}

export default SelectPrompt;
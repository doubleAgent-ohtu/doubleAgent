import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncSelect from 'react-select/async';


const SelectPrompt = ({ chatbot, setPromptInput }) => {
  const [prompts, setPrompts] = useState([]);
  const [query, setQuery] = useState('');

  const loadPrompts = async () => {
    try {
      const res = await axios.get(
        `api/get_user_prompts/?query=${query}&offset=0&limit=25`
      );
      return res.data.map(
        prompt => ({value: prompt.prompt, label: prompt.agent_name})
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handlePromptSelect = (prompt) => {
    console.log(prompt);
    setPromptInput(prompt.value);
  }

  {/*
  const updatePrompts = async (offset, limit, append) => {
    try {
      const res = await axios.get(
        `api/get_user_prompts/?search=${search}&offset=${offset}&limit=${limit}`
      );
      const data = res.data.map(
        prompt => ({value: prompt.prompt, label: prompt.agent_name})
      );

      if (append) {
        setPrompts(prev => ([...prev, ...data]));
      } else {
        setPrompts(data);
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {updatePrompts(0, 25)}, []);
  */}

  
  return (
    <div>
      <button>
        <h3>Prompt {chatbot}</h3>
    </button>
      <div>
        <AsyncSelect
         defaultValue="Select prompt"
         onInputChange={value => setQuery(value)}
         loadOptions={loadPrompts}
         onChange={handlePromptSelect}
        />
      </div>
    </div>
  )
};

export default SelectPrompt;
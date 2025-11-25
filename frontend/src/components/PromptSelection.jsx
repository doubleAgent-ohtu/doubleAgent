import { useState, useEffect } from 'react';
import Select, { createFilter } from 'react-select';


const SelectPrompt = ({ savedPrompts, setText }) => {
  const [promptOptions, setPromptOptions] = useState([]);

  const handlePromptSelect = (option) => {
    try {
      const promptId = option.value;
      setText(savedPrompts.get(promptId).prompt);
    } catch (err) {
      console.log(err);
      setText('');
    }
  }

  useEffect(() => {
    setPromptOptions(() => {
      let newPromptOptions = [];
      try {
        const promptData = Array.from(savedPrompts);
        let i = promptData.length;

        while (--i >= 0) {
          const [prompId, prompt] = promptData[i];
          newPromptOptions.push({value: prompId, label: prompt.agent_name});
        };
      } catch (err) {
        console.log(err);
      } finally {
        return newPromptOptions;
      }
    });
  }, [savedPrompts]);

  return (
    <div>
      <Select 
       options={promptOptions}
       onChange={handlePromptSelect}
       placeholder="Select prompt"
       noOptionsMessage={() => "No prompts found"}
       filterOption={createFilter({
         ignoreCase: true,
         ignoreAccents: true,
         matchFrom: 'any',
         stringify: option => `${option.label}`,
         trim: true,
       })}
       unstyled
       styles={customStyles}
      />
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
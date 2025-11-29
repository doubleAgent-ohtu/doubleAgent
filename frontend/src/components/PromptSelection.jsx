import { useState, useEffect, useRef } from 'react';
import Select, { createFilter } from 'react-select';

const SelectPrompt = ({ savedPrompts, setText }) => {
  const [promptOptions, setPromptOptions] = useState([]);
  const inputRef = useRef();

  const handlePromptSelect = (option) => {
    try {
      const promptId = option.value;
      setText(savedPrompts.get(promptId).prompt);
    } catch (err) {
      console.log(err);
      setText('');
    }
  };

  // Prevents automatic focus on the input when the prompt editor modal is opened
  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.blur();
    }
  }, []);

  useEffect(() => {
    setPromptOptions(() => {
      let newPromptOptions = [];
      try {
        const promptData = Array.from(savedPrompts);
        let i = promptData.length;

        while (--i >= 0) {
          const [prompId, prompt] = promptData[i];
          newPromptOptions.push({ value: prompId, label: prompt.agent_name });
        }
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
        placeholder="Select prompt (type to search)"
        noOptionsMessage={() => 'No prompts found'}
        filterOption={createFilter({
          ignoreCase: true,
          ignoreAccents: true,
          matchFrom: 'any',
          stringify: (option) => `${option.label}`,
          trim: true,
        })}
        unstyled
        classNames={{
          control: () => 'input input-bordered w-full my-2 pr-0',
          indicatorsContainer: () => 'p-1 gap-1',
          indicatorSeparator: () => 'bg-(--color-base-content)/20',
          dropdownIndicator: () =>
            'p-1 text-(--color-base-content)/40 hover:text-(--color-base-content)/60',
          menu: () =>
            'p-1 mt-2 border border-(--color-base-content)/20 rounded-sm bg-(--color-base-100)',
          option: ({ isFocused, isSelected }) =>
            `px-3 py-2 rounded ${
              isSelected ? 'bg-(--color-base-300)' : isFocused ? 'bg-(--color-base-200)' : ''
            }`,
        }}
        ref={inputRef}
      />
    </div>
  );
};

export default SelectPrompt;

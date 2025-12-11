import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { expect, vi } from 'vitest';
import { PromptEditor, PromptMenu } from './PromptManagerModal';

vi.mock('axios');

afterEach(() => {
  vi.restoreAllMocks();
});

const savedPrompts = [
  { id: 1, agent_name: 'Pirate', prompt: 'Talk like a pirate.', created_at: null },
  {
    id: 2,
    agent_name: 'A',
    prompt: 'Only use words that start with the letter A.',
    created_at: null,
  },
  { id: 3, agent_name: 'Assistant', prompt: 'Be a polite assistant.', created_at: null },
  { id: 4, agent_name: 'Parrot', prompt: 'Be a parrot.', created_at: null },
].reduce((promptMap, prompt) => promptMap.set(prompt.id, prompt), new Map());

const promptMenuProps = {
  selected: null,
  onSetPrompt: vi.fn(),
  setPromptManagerContext: vi.fn(),
  savedPrompts: savedPrompts,
  setSavedPrompts: vi.fn(),
  chatbot: '',
  onClose: vi.fn(),
  showAlert: vi.fn(),
};

const promptEditorProps = {
  promptData: { id: null, agent_name: '', prompt: '', created_at: null },
  onSetPrompt: vi.fn(),
  setSavedPrompts: vi.fn(),
  chatbot: 'A',
  onClose: vi.fn(),
  showAlert: vi.fn(),
};

test('1. Renders prompt menu', () => {
  render(<PromptMenu {...promptMenuProps} />);
  const promptMenu = screen.getByTestId('promptManagerPromptMenu');
  waitFor(() => expect(promptMenu).toBeInTheDocument());

  expect(screen.getByText('My Prompts')).toBeInTheDocument();
  expect(screen.getByText('Add new prompt')).toBeInTheDocument();
  expect(screen.getByText('Pirate')).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();
});

test('2. Selecting sets prompt', async () => {
  render(<PromptMenu {...promptMenuProps} />);
  const promptMenu = screen.getByTestId('promptManagerPromptMenu');
  waitFor(() => expect(promptMenu).toBeInTheDocument());

  const user = userEvent.setup();
  await user.click(screen.getByText('Pirate'));
  expect(promptMenuProps.onSetPrompt).toHaveBeenCalledWith(savedPrompts.get(1));
});

test("3. Clicking 'Add new prompt' sets promptManagerContext correctly", async () => {
  render(<PromptMenu {...promptMenuProps} chatbot="A" />);
  const user = userEvent.setup();
  await user.click(screen.getByText('Add new prompt'));

  expect(promptMenuProps.setPromptManagerContext).toHaveBeenCalledWith({
    chatbot: 'A',
    promptData: { id: null, agent_name: '', prompt: '', created_at: null },
    onSetPrompt: promptMenuProps.onSetPrompt,
    isEditor: true,
  });
});

test("4. Clicking 'Edit' to edit a prompt sets promptManagerContext correctly", async () => {
  render(<PromptMenu {...promptMenuProps} chatbot="B" />);
  const promptMenu = screen.getByTestId('promptManagerPromptMenu');
  waitFor(() => expect(promptMenu).toBeInTheDocument());

  const user = userEvent.setup();
  await user.click(screen.getByTestId(`edit-${3}`));

  expect(promptMenuProps.setPromptManagerContext).toHaveBeenCalledWith({
    chatbot: 'B',
    promptData: savedPrompts.get(3),
    onSetPrompt: promptMenuProps.onSetPrompt,
    isEditor: true,
  });
});

test('5. Prompt deletion successfull', async () => {
  render(<PromptMenu {...promptMenuProps} />);
  const promptMenu = screen.getByTestId('promptManagerPromptMenu');
  waitFor(() => expect(promptMenu).toBeInTheDocument());

  axios.delete.mockResolvedValue({ message: 'Prompt deleted successfully' });
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  const user = userEvent.setup();
  await user.click(screen.getByTestId(`del-${4}`));

  expect(axios.delete).toHaveBeenCalledWith('api/delete_prompt/4');
  expect(confirmSpy).toBeCalled();
  expect(promptMenuProps.showAlert).toHaveBeenCalledWith("'Parrot' deleted", 'success');
});

test('6. Prompt deletion failed', async () => {
  render(<PromptMenu {...promptMenuProps} />);
  const promptMenu = screen.getByTestId('promptManagerPromptMenu');
  waitFor(() => expect(promptMenu).toBeInTheDocument());

  axios.delete.mockRejectedValue(new Error());
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

  const user = userEvent.setup();
  await user.click(screen.getByTestId(`del-${2}`));

  expect(axios.delete).toHaveBeenCalledWith('api/delete_prompt/2');
  expect(confirmSpy).toBeCalled();
  expect(promptMenuProps.showAlert).toHaveBeenCalledWith('Error occured while deleting', 'error');
});

test('7. Renders prompt editor with empty fields', () => {
  render(<PromptEditor {...promptEditorProps} />);
  expect(screen.getByText('Set Prompt A')).toBeInTheDocument();
  expect(screen.getByLabelText('Agent Name')).toHaveValue('');
  expect(screen.getByLabelText('System Prompt')).toHaveValue('');
});

test('8. Renders prompt editor with a prompt to edit', () => {
  render(<PromptEditor {...promptEditorProps} promptData={savedPrompts.get(1)} chatbot="B" />);
  expect(screen.getByText('Set Prompt B')).toBeInTheDocument();
  expect(screen.getByLabelText('Agent Name')).toHaveValue('Pirate');
  expect(screen.getByLabelText('System Prompt')).toHaveValue('Talk like a pirate.');
});

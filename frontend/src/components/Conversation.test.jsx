import axios from 'axios';
import { vi, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Conversation from './Conversation';
import { useBotConfig } from '../contexts/BotConfigContext';

// This bypasses the need for a Provider and lets us inject data directly
vi.mock('../contexts/BotConfigContext', () => ({
  useBotConfig: vi.fn(),
}));

// Setup Global Mocks
globalThis.fetch = vi.fn();
vi.mock('axios');

Element.prototype.scrollTo = vi.fn();

// We removed promptA/promptB/onClearPrompts from props, so we clean this up
const defaultProps = {
  onActivate: vi.fn(),
  // openConversation and newChatSignal are still props in PR #1
};

// Default Context Values to use in most tests
const mockResetPrompts = vi.fn();
const defaultContextValues = {
  promptA: { prompt: '', agent_name: '' },
  promptB: { prompt: '', agent_name: '' },
  resetPrompts: mockResetPrompts,
  initPrompt: { id: null, agent_name: '', prompt: '', created_at: null },
};

beforeEach(() => {
  vi.clearAllMocks();

  // 3. Set default behavior for the context hook
  useBotConfig.mockReturnValue(defaultContextValues);

  // Reset default axios implementations
  axios.get.mockResolvedValue({ data: {} });
  axios.post.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({ data: {} });
});

test('1. Renders conversation starter input', () => {
  render(<Conversation {...defaultProps} />);
  const input = screen.getByPlaceholderText('Conversation starter...');
  expect(input).toBeInTheDocument();
});

test('2. Renders Start button', () => {
  render(<Conversation {...defaultProps} />);
  const startButton = screen.getByText('Start');
  expect(startButton).toBeInTheDocument();
});

test('3. Start button is disabled when input is empty', () => {
  render(<Conversation {...defaultProps} />);
  const startButton = screen.getByText('Start');
  expect(startButton).toBeDisabled();
});

test('4. Start button is enabled when input has text', () => {
  render(<Conversation {...defaultProps} />);
  const input = screen.getByPlaceholderText('Conversation starter...');
  fireEvent.change(input, { target: { value: 'Hello' } });
  const startButton = screen.getByText('Start');
  expect(startButton).not.toBeDisabled();
});

test('5. Clear button is not visible when no messages', () => {
  render(<Conversation {...defaultProps} />);
  const clearButton = screen.queryByText('Clear');
  expect(clearButton).not.toBeInTheDocument();
});

test('6. Renders model selection dropdown', () => {
  render(<Conversation {...defaultProps} />);
  const modelSelect = screen.getByRole('combobox');
  expect(modelSelect).toBeInTheDocument();
});

test('7. Renders turns input with default value 3', () => {
  render(<Conversation {...defaultProps} />);
  const turnsInput = screen.getByDisplayValue('3');
  expect(turnsInput).toBeInTheDocument();
});

test('8. Shows placeholder text when no messages', () => {
  render(<Conversation {...defaultProps} />);
  expect(screen.getByText('Type a message to start...')).toBeInTheDocument();
});

test('9. Turns input has min 1 and max 20 attributes', () => {
  render(<Conversation {...defaultProps} />);
  const turnsInput = screen.getByDisplayValue('3');
  expect(turnsInput).toHaveAttribute('min', '1');
  expect(turnsInput).toHaveAttribute('max', '20');
});

test('10. Model selection has default value gpt-4o', () => {
  render(<Conversation {...defaultProps} />);
  const modelSelect = screen.getByRole('combobox');
  expect(modelSelect.value).toBe('gpt-4o');
});

test('11. Turns input value can be changed', () => {
  render(<Conversation {...defaultProps} />);
  const turnsInput = screen.getByDisplayValue('3');
  fireEvent.change(turnsInput, { target: { value: '5' } });
  expect(turnsInput.value).toBe('5');
});

test('12. Input field updates when typing', () => {
  render(<Conversation {...defaultProps} />);
  const input = screen.getByPlaceholderText('Conversation starter...');
  fireEvent.change(input, { target: { value: 'Test message' } });
  expect(input.value).toBe('Test message');
});

test('13. Start sends POST to /api/conversation and appends user message', async () => {
  globalThis.fetch.mockImplementationOnce((url) => {
    if (url === '/api/conversation') {
      return Promise.resolve({
        ok: true,
        body: { getReader: () => ({ read: async () => ({ done: true }) }) },
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  render(<Conversation {...defaultProps} />);

  const input = screen.getByPlaceholderText('Conversation starter...');
  fireEvent.change(input, { target: { value: 'Hello!' } });
  fireEvent.click(screen.getByText('Start'));

  await waitFor(() =>
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object)),
  );

  expect(await screen.findByText('Hello!')).toBeInTheDocument();
});

test('14. Save posts conversation with system prompts from Context', async () => {
  // --- NEW LOGIC: Override the Mock Context for this specific test ---
  useBotConfig.mockReturnValue({
    ...defaultContextValues,
    promptA: { prompt: 'Prompt A text', agent_name: 'Agent A' },
    promptB: { prompt: 'Prompt B text', agent_name: 'Agent B' },
  });

  // Mock Fetch for the "Start" action
  globalThis.fetch.mockImplementation((url) => {
    if (url === '/api/conversation') {
      return Promise.resolve({
        ok: true,
        body: { getReader: () => ({ read: async () => ({ done: true }) }) },
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  axios.post.mockResolvedValue({ data: { id: 123 } });

  render(<Conversation {...defaultProps} />);

  // Start chat to make Save button appear
  fireEvent.change(screen.getByPlaceholderText('Conversation starter...'), {
    target: { value: 'Hi' },
  });
  fireEvent.click(screen.getByText('Start'));

  const saveButton = await screen.findByText('Save');
  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      '/api/conversations',
      expect.objectContaining({
        // The component now extracts .prompt from the context object
        system_prompt_a: 'Prompt A text',
        system_prompt_b: 'Prompt B text',
      }),
    );
  });
});

test('15. Clear dispatches conversation:deleted and sends DELETE', async () => {
  axios.get.mockResolvedValue({ data: { id: 42, messages: [] } });
  axios.delete.mockResolvedValue({ data: { success: true } });

  globalThis.fetch.mockImplementation((url) => {
    if (url === '/api/conversation') {
      return Promise.resolve({
        ok: true,
        body: { getReader: () => ({ read: async () => ({ done: true }) }) },
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  const openConv = { id: 42 };

  render(<Conversation {...defaultProps} openConversation={openConv} />);

  fireEvent.change(screen.getByPlaceholderText('Conversation starter...'), {
    target: { value: 'Bye' },
  });
  fireEvent.click(screen.getByText('Start'));

  const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

  const clearButton = await screen.findByText('Clear');
  fireEvent.click(clearButton);

  // Check Axios DELETE
  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      '/api/conversations/42',
      expect.objectContaining({ withCredentials: true }),
    );
  });

  // Check window event (Old logic, still present in PR #1)
  expect(dispatchSpy.mock.calls.some((c) => c[0] && c[0].type === 'conversation:deleted')).toBe(
    true,
  );
});

import axios from 'axios';
import { vi, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Conversation from './Conversation';

// Setup Global Mocks
globalThis.fetch = vi.fn();
vi.mock('axios');

Element.prototype.scrollTo = vi.fn();

const defaultProps = {
  promptA: '',
  promptB: '',
  onActivate: vi.fn(),
  onClearPrompts: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset default axios implementations to avoid undefined errors
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
  // Streaming still uses fetch, so we mock fetch here
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

test('14. Save posts conversation with system prompts', async () => {
  // Mock Fetch for the "Start" action (Streaming)
  globalThis.fetch.mockImplementation((url) => {
    if (url === '/api/conversation') {
      return Promise.resolve({
        ok: true,
        body: { getReader: () => ({ read: async () => ({ done: true }) }) },
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  // Mock Axios for the "Save" action
  axios.post.mockResolvedValue({ data: { id: 123 } });

  const props = { ...defaultProps, promptA: 'Prompt A text', promptB: 'Prompt B text' };
  render(<Conversation {...props} />);

  // Start chat to make Save button appear
  fireEvent.change(screen.getByPlaceholderText('Conversation starter...'), {
    target: { value: 'Hi' },
  });
  fireEvent.click(screen.getByText('Start'));

  const saveButton = await screen.findByText('Save');
  fireEvent.click(saveButton);

  // Check Axios instead of fetch
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      '/api/conversations',
      expect.objectContaining({
        system_prompt_a: 'Prompt A text',
        system_prompt_b: 'Prompt B text',
      }),
    );
  });
});

test('15. Clear dispatches conversation:deleted and sends DELETE request', async () => {
  // Mock Axios GET (Prevent crash on mount when loading ID 42)
  axios.get.mockResolvedValue({ data: { id: 42, messages: [] } });

  // Mock Axios DELETE (for the "Clear" button)
  axios.delete.mockResolvedValue({ data: { success: true } });

  // Mock Fetch (for the "Start" button streaming)
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

  // Start a conversation
  fireEvent.change(screen.getByPlaceholderText('Conversation starter...'), {
    target: { value: 'Bye' },
  });
  fireEvent.click(screen.getByText('Start'));

  const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

  // Click Clear
  const clearButton = await screen.findByText('Clear');
  fireEvent.click(clearButton);

  // --- ASSERTIONS ---

  // Check event dispatch
  expect(dispatchSpy.mock.calls.some((c) => c[0] && c[0].type === 'conversation:deleted')).toBe(
    true,
  );

  // Check Axios DELETE was called
  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      '/api/conversations/42',
      expect.objectContaining({ withCredentials: true }),
    );
  });
});

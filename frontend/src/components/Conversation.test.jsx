import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Conversation from './Conversation';

global.fetch = vi.fn();

Element.prototype.scrollTo = vi.fn();

const defaultProps = {
  promptA: '',
  promptB: '',
  onActivate: vi.fn(),
  onClearPrompts: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
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
  global.fetch.mockImplementationOnce((url, opts) => {
    if (url === '/api/conversation') {
      return Promise.resolve({ ok: true, body: { getReader: () => ({ read: async () => ({ done: true }) }) } });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  render(<Conversation {...defaultProps} />);

  const input = screen.getByPlaceholderText('Conversation starter...');
  fireEvent.change(input, { target: { value: 'Hello!' } });
  fireEvent.click(screen.getByText('Start'));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/conversation', expect.any(Object)));

  expect(await screen.findByText('Hello!')).toBeInTheDocument();
});

test('14. Save posts conversation with system prompts', async () => {
  global.fetch.mockImplementation((url, opts) => {
    if (url === '/api/conversation') {
      return Promise.resolve({ ok: true, body: { getReader: () => ({ read: async () => ({ done: true }) }) } });
    }
    if (url === '/api/conversations') {
      return Promise.resolve({ ok: true, json: async () => ({ id: 123 }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  const props = { ...defaultProps, promptA: 'Prompt A text', promptB: 'Prompt B text' };
  render(<Conversation {...props} />);

  fireEvent.change(screen.getByPlaceholderText('Conversation starter...'), { target: { value: 'Hi' } });
  fireEvent.click(screen.getByText('Start'));

  const saveButton = await screen.findByText('Save');
  fireEvent.click(saveButton);

  await waitFor(() => {
    const postCall = global.fetch.mock.calls.find((c) => c[0] === '/api/conversations');
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall[1].body);
    expect(body.system_prompt_a).toBe('Prompt A text');
    expect(body.system_prompt_b).toBe('Prompt B text');
  });
});

test('15. Clear dispatches conversation:deleted and sends DELETE request', async () => {
  global.fetch.mockImplementation((url, opts) => {
    if (url === '/api/conversation') {
      return Promise.resolve({ ok: true, body: { getReader: () => ({ read: async () => ({ done: true }) }) } });
    }
    if (url.startsWith('/api/conversations/')) {
      return Promise.resolve({ ok: true });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });

  const openConv = { id: 42 };
  render(<Conversation {...{ ...defaultProps, openConversation: openConv }} />);

  fireEvent.change(screen.getByPlaceholderText('Conversation starter...'), { target: { value: 'Bye' } });
  fireEvent.click(screen.getByText('Start'));

  const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

  const clearButton = await screen.findByText('Clear');
  fireEvent.click(clearButton);

  expect(dispatchSpy.mock.calls.some((c) => c[0] && c[0].type === 'conversation:deleted')).toBe(true);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/conversations/42', expect.objectContaining({ method: 'DELETE' }));
  });
});

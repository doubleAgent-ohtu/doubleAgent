import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Menu from './Menu';

beforeEach(() => {
  vi.clearAllMocks();
});

test('1. Renders main menu buttons', () => {
  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={() => {}} />);

  expect(screen.getByText('Homepage')).toBeInTheDocument();
  expect(screen.getByText('New chat')).toBeInTheDocument();
  expect(screen.getByText('User Guide')).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
  expect(screen.getByText('Logout')).toBeInTheDocument();
});

test('2. Clicking New chat dispatches event and calls onNewChat prop', async () => {
  const onNewChat = vi.fn();
  const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={onNewChat} />);

  const btn = screen.getByText('New chat');
  fireEvent.click(btn);

  expect(onNewChat).toHaveBeenCalledTimes(1);
  expect(dispatchSpy).toHaveBeenCalled();

  dispatchSpy.mockRestore();
});

test('3. Loads and renders conversation starters, clicking calls onSelectConversation', async () => {
  const fakeConvos = [
    { id: 1, conversation_starter: 'Hello world', system_prompt_a: 'A', system_prompt_b: 'B' },
    { id: 2, conversation_starter: 'This is a longer starter that will be truncated at forty characters for display', system_prompt_a: null, system_prompt_b: null },
  ];

  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(fakeConvos) })
  );

  const onSelectConversation = vi.fn();
  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={onSelectConversation} onNewChat={() => {}} />);

  // wait for the starters to be rendered
  await waitFor(() => expect(screen.getByText('Chat history')).toBeInTheDocument());

  // first starter full text
  expect(screen.getByText('Hello world')).toBeInTheDocument();

  // second starter should be truncated to 40 chars + '...'
  expect(screen.getByText((content) => content.startsWith('This is a longer starter'))).toBeInTheDocument();

  // click first starter
  const firstBtn = screen.getByText('Hello world');
  fireEvent.click(firstBtn);

  expect(onSelectConversation).toHaveBeenCalledTimes(1);
  expect(onSelectConversation).toHaveBeenCalledWith(fakeConvos[0]);
});

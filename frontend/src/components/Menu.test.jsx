import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Menu from './Menu';
import axios from 'axios';

const _origFetch = global.fetch;
const _origLocation = global.window.location;

beforeEach(() => {
  vi.clearAllMocks();
  // ensure tests start with a clean localStorage
  localStorage.clear();
});

afterEach(() => {
  // restore any mocked fetch to avoid leaking into other tests
  global.fetch = _origFetch;
  // restore location if tests replaced it
  try {
    global.window.location = _origLocation;
  } catch (e) {
    // ignore in environments that disallow reassignment
  }
});

test('1. Renders main menu buttons', () => {
  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={() => {}} />);

  expect(screen.getByText('Homepage')).toBeInTheDocument();
  expect(screen.getByText('New Chat')).toBeInTheDocument();
  expect(screen.getByText('User Guide')).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
  expect(screen.getByText('Logout')).toBeInTheDocument();
});

test('2. Clicking New Chat dispatches event and calls onNewChat prop', async () => {
  const onNewChat = vi.fn();
  const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={onNewChat} />);

  const btn = screen.getByText('New Chat');
  fireEvent.click(btn);

  expect(onNewChat).toHaveBeenCalledTimes(1);
  expect(dispatchSpy).toHaveBeenCalled();
  // ensure the dispatched event is specifically the new-chat:start event
  const calledTypes = dispatchSpy.mock.calls.map((c) => c[0]?.type).filter(Boolean);
  expect(calledTypes).toContain('new-chat:start');

  dispatchSpy.mockRestore();
});

test('3. Loads and renders conversation starters, clicking calls onSelectConversation', async () => {
  const fakeConvos = [
    { id: 1, conversation_starter: 'Hello world', system_prompt_a: 'A', system_prompt_b: 'B' },
    {
      id: 2,
      conversation_starter:
        'This is a longer starter that will be truncated at forty characters for display',
      system_prompt_a: null,
      system_prompt_b: null,
    },
  ];

  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(fakeConvos) }),
  );

  const onSelectConversation = vi.fn();
  render(
    <Menu
      onOpenUserGuide={() => {}}
      onSelectConversation={onSelectConversation}
      onNewChat={() => {}}
    />,
  );

  // wait for the starters to be rendered
  await waitFor(() => expect(screen.getByText('Chat History')).toBeInTheDocument());

  // first starter full text
  expect(screen.getByText('Hello world')).toBeInTheDocument();

  // second starter should be truncated to 80 chars + '...'
  expect(
    screen.getByText((content) => content.startsWith('This is a longer starter')),
  ).toBeInTheDocument();

  // click first starter
  const firstBtn = screen.getByText('Hello world');
  fireEvent.click(firstBtn);

  expect(onSelectConversation).toHaveBeenCalledTimes(1);
  expect(onSelectConversation).toHaveBeenCalledWith(fakeConvos[0]);
});

test('4. Truncation produces exactly 80 chars + ellipsis', async () => {
  const longStarter = 'x'.repeat(150);
  const fakeConvos = [
    { id: 1, conversation_starter: longStarter, system_prompt_a: null, system_prompt_b: null },
  ];

  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(fakeConvos) }),
  );

  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={() => {}} />);

  await waitFor(() => expect(screen.getByText('Chat History')).toBeInTheDocument());

  const truncated = screen.getByText((c) => c.endsWith('...'));
  // should be 83 characters total: 80 + '...'
  expect(truncated.textContent.length).toBe(83);
});

test('5. Logout calls axios.post and redirects', async () => {
  const origLocation = global.window.location;
  // replace location so assignment won't throw and we can inspect final href
  try {
    delete global.window.location;
  } catch (e) {
    // ignore
  }
  global.window.location = { href: '', assign: vi.fn() };

  axios.post = vi.fn(() => Promise.resolve({ status: 200 }));

  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={() => {}} />);

  const logoutBtn = screen.getByText('Logout');
  fireEvent.click(logoutBtn);

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/api/logout', {}, { withCredentials: true }),
  );
  // component sets window.location.href = '/' on success
  expect(
    global.window.location.href === '/' || global.window.location.assign.mock.calls.length > 0,
  ).toBeTruthy();

  // restore original location
  global.window.location = origLocation;
});

test('6. Theme toggle updates document attribute and localStorage', async () => {
  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={() => {}} />);

  const toggle = screen.getByLabelText('Toggle theme');
  // initial theme should be set by effect; clear ensures default 'light'
  const initial = document.documentElement.getAttribute('data-theme') || 'light';

  fireEvent.click(toggle);

  const newTheme = document.documentElement.getAttribute('data-theme');
  expect(newTheme).not.toBe(initial);
  expect(localStorage.getItem('theme')).toBe(newTheme);
});

test('7. Toggle sidebar flips drawer checkbox checked state', async () => {
  // create a dummy checkbox that toggleDrawer will touch
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = 'my-drawer-4';
  document.body.appendChild(cb);

  render(<Menu onOpenUserGuide={() => {}} onSelectConversation={() => {}} onNewChat={() => {}} />);

  const toggleBtn = screen.getByLabelText('Toggle sidebar');
  // initial unchecked
  expect(cb.checked).toBeFalsy();

  fireEvent.click(toggleBtn);
  expect(cb.checked).toBeTruthy();

  fireEvent.click(toggleBtn);
  expect(cb.checked).toBeFalsy();

  document.body.removeChild(cb);
});

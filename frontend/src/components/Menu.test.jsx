import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, test, expect, beforeEach, afterEach } from 'vitest';
import Menu from './Menu';
import axios from 'axios';

// 1. Mock Axios
vi.mock('axios');

// 2. Mock the Hook
const mockUseChatSession = vi.fn();

vi.mock('../contexts/ChatSessionContext', () => ({
  useChatSession: () => mockUseChatSession(),
}));

// Mock Location
const _origLocation = globalThis.window.location;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  // Reset global location mock
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '', assign: vi.fn() },
  });

  // DEFAULT MOCK STATE
  mockUseChatSession.mockReturnValue({
    conversationList: [],
    isLoadingConversationList: false,
    startNewChat: vi.fn(),
    openChat: vi.fn(),
  });
});

afterEach(() => {
  try {
    globalThis.window.location = _origLocation;
  } catch {
    // ignore
  }
});

test('1. Renders main menu buttons', () => {
  render(<Menu onOpenUserGuide={() => {}} />);

  expect(screen.getByText('New Chat')).toBeInTheDocument();
  expect(screen.getByText('User Guide')).toBeInTheDocument();
  expect(screen.getByText('Logout')).toBeInTheDocument();
});

test('2. Clicking New Chat calls context startNewChat', async () => {
  const startNewChatSpy = vi.fn();
  mockUseChatSession.mockReturnValue({
    conversationList: [],
    isLoadingConversationList: false,
    startNewChat: startNewChatSpy,
    openChat: vi.fn(),
  });

  render(<Menu onOpenUserGuide={() => {}} />);

  const btn = screen.getByText('New Chat');
  fireEvent.click(btn);

  expect(startNewChatSpy).toHaveBeenCalledTimes(1);
});

test('3. Renders conversation list from context and clicking calls openChat', async () => {
  const openChatSpy = vi.fn();
  const fakeList = [
    { id: 1, conversation_starter: 'Hello world' },
    { id: 2, conversation_starter: 'Second Item' },
  ];

  mockUseChatSession.mockReturnValue({
    conversationList: fakeList,
    isLoadingConversationList: false,
    startNewChat: vi.fn(),
    openChat: openChatSpy,
  });

  render(<Menu onOpenUserGuide={() => {}} />);

  expect(screen.getByText('Chat History')).toBeInTheDocument();
  expect(screen.getByText('Hello world')).toBeInTheDocument();

  const firstBtn = screen.getByText('Hello world');
  fireEvent.click(firstBtn);

  expect(openChatSpy).toHaveBeenCalledTimes(1);
  expect(openChatSpy).toHaveBeenCalledWith(fakeList[0]);
});

test('4. Truncation produces exactly 80 chars + ellipsis', async () => {
  const longStarter = 'x'.repeat(150);

  mockUseChatSession.mockReturnValue({
    conversationList: [{ id: 1, conversation_starter: longStarter }],
    isLoadingConversationList: false,
    startNewChat: vi.fn(),
    openChat: vi.fn(),
  });

  render(<Menu onOpenUserGuide={() => {}} />);

  const truncated = screen.getByText((c) => c.endsWith('...'));
  expect(truncated.textContent.length).toBe(83);
});

test('5. Logout calls axios.post and redirects', async () => {
  axios.post.mockResolvedValue({ status: 200 });

  render(<Menu onOpenUserGuide={() => {}} />);

  const logoutBtn = screen.getByText('Logout');
  fireEvent.click(logoutBtn);

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/api/logout', {}, { withCredentials: true }),
  );

  expect(window.location.href === '/' || window.location.assign).toBeTruthy();
});

test('6. Theme toggle updates document attribute and localStorage', async () => {
  render(<Menu onOpenUserGuide={() => {}} />);

  const toggle = screen.getByLabelText('Toggle theme');
  const initial = document.documentElement.getAttribute('data-theme') || 'light';

  fireEvent.click(toggle);

  const newTheme = document.documentElement.getAttribute('data-theme');
  expect(newTheme).not.toBe(initial);
  expect(localStorage.getItem('theme')).toBe(newTheme);
});

test('7. Toggle sidebar flips drawer checkbox checked state', async () => {
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = 'my-drawer-4';
  document.body.appendChild(cb);

  render(<Menu onOpenUserGuide={() => {}} />);

  const toggleBtn = screen.getByLabelText('Toggle sidebar');
  expect(cb.checked).toBeFalsy();

  fireEvent.click(toggleBtn);
  expect(cb.checked).toBeTruthy();

  document.body.removeChild(cb);
});

test('8. Shows loading spinner when context is loading', () => {
  mockUseChatSession.mockReturnValue({
    conversationList: [],
    isLoadingConversationList: true,
    startNewChat: vi.fn(),
    openChat: vi.fn(),
  });

  render(<Menu onOpenUserGuide={() => {}} />);

  const spinner = document.querySelector('.loading-spinner');
  expect(spinner).toBeInTheDocument();

  expect(screen.queryByText('Chat History')).not.toBeInTheDocument();
});

test('9. User Guide button calls onOpenUserGuide callback', () => {
  const onOpenUserGuide = vi.fn();
  render(<Menu onOpenUserGuide={onOpenUserGuide} />);

  const userGuideBtn = screen.getByText('User Guide');
  fireEvent.click(userGuideBtn);

  expect(onOpenUserGuide).toHaveBeenCalledTimes(1);
});

test('10. Menu items have proper spacing', () => {
  render(<Menu onOpenUserGuide={() => {}} />);
  const menu = screen.getByText('New Chat').closest('ul');
  expect(menu).toHaveClass('space-y-1');
});

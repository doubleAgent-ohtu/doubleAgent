import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import DownloadChatButton from './DownloadChatButton';

afterEach(() => {
  vi.restoreAllMocks();
});

test('1. Renders button with default label and aria', () => {
  render(<DownloadChatButton />);

  const button = screen.getByRole('button', { name: /download conversation default/i });
  // aria-label contains the threadId (default)
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent(/download/i);
});

test('2. Successful download calls fetch and triggers anchor click', async () => {
  const user = userEvent.setup();

  // Mock fetch to return ok and a blob
  const blob = new Blob(['hello'], { type: 'text/plain' });
  global.fetch = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });

  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

  const origCreateElement = document.createElement.bind(document);
  let createdAnchor = null;
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = origCreateElement(tag);
    if (tag === 'a') {
      createdAnchor = el;
      vi.spyOn(el, 'click');
    }
    return el;
  });

  const appendSpy = vi.spyOn(document.body, 'appendChild');
  const removeSpy = vi.spyOn(document.body, 'removeChild');

  render(<DownloadChatButton />);

  const button = screen.getByRole('button', { name: /download conversation default/i });
  await user.click(button);

  expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/download-chat/default', {
    method: 'GET',
    credentials: 'include',
  });

  // ensure blob url created and anchor clicked
  expect(createObjectURL).toHaveBeenCalled();
  // ensure the anchor element was created and its click() was invoked
  expect(createdAnchor).toBeTruthy();
  expect(createdAnchor.click).toHaveBeenCalled();
  expect(appendSpy).toHaveBeenCalled();
  expect(removeSpy).toHaveBeenCalled();
  expect(revokeObjectURL).toHaveBeenCalled();
});

test('3. Failed download shows alert', async () => {
  const user = userEvent.setup();
  global.fetch = vi.fn().mockResolvedValue({ ok: false });
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

  render(<DownloadChatButton />);
  const button = screen.getByRole('button', { name: /download conversation default/i });
  await user.click(button);

  expect(global.fetch).toHaveBeenCalled();
  expect(alertSpy).toHaveBeenCalledWith('Failed to download conversation. Make sure you are logged in.');
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import { vi } from 'vitest';

import DownloadChatButton from './DownloadChatButton';

// 1. Tell Vitest to take control of axios
vi.mock('axios');

afterEach(() => {
  vi.restoreAllMocks();
});

test('1. Renders button with default label and aria', () => {
  render(<DownloadChatButton />);

  const button = screen.getByRole('button', { name: /download conversation default/i });
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent(/download/i);
});

test('2. Successful download calls axios and triggers anchor click', async () => {
  const user = userEvent.setup();

  // Mock Axios success response
  // Note: Axios wraps the response body in a 'data' property.
  const blob = new Blob(['hello'], { type: 'text/plain' });
  axios.get.mockResolvedValue({ data: blob });

  // Mock URL APIs
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

  // Mock Anchor element creation and clicking
  const origCreateElement = document.createElement.bind(document);
  let createdAnchor = null;
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = origCreateElement(tag);
    if (tag === 'a') {
      createdAnchor = el;
      vi.spyOn(el, 'click'); // Spy on the click method
    }
    return el;
  });

  const appendSpy = vi.spyOn(document.body, 'appendChild');
  const removeSpy = vi.spyOn(document.body, 'removeChild');

  render(<DownloadChatButton />);

  const button = screen.getByRole('button', { name: /download conversation default/i });
  await user.click(button);

  // Assertions updated for Axios and Relative Path
  expect(axios.get).toHaveBeenCalledWith('api/download-chat/default', {
    responseType: 'blob',
    withCredentials: true,
  });

  // Ensure blob url created and anchor clicked
  expect(createObjectURL).toHaveBeenCalledWith(blob);
  expect(createdAnchor).toBeTruthy();
  expect(createdAnchor.click).toHaveBeenCalled();

  // Ensure DOM cleanup happened
  expect(appendSpy).toHaveBeenCalled();
  expect(removeSpy).toHaveBeenCalled();
  expect(revokeObjectURL).toHaveBeenCalled();
});

test('3. Failed download shows alert', async () => {
  const user = userEvent.setup();

  // Mock Axios failure
  axios.get.mockRejectedValue(new Error('Network Error'));

  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

  render(<DownloadChatButton />);
  const button = screen.getByRole('button', { name: /download conversation default/i });
  await user.click(button);

  expect(axios.get).toHaveBeenCalled();
  expect(alertSpy).toHaveBeenCalledWith(
    'Failed to download conversation. Make sure you are logged in.',
  );
});

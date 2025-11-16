import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { HealthCheckButton } from './HealthCheckButton';

// Mock global fetch before each test
beforeEach(() => {
  // Use 'vi' instead of 'jest'
  vi.spyOn(global, 'fetch');
});

// Restore global fetch after each test
afterEach(() => {
  // Use 'vi' instead of 'jest'
  vi.restoreAllMocks();
});

// --- Tests ---

test('1. Renders button, but no initial status', () => {
  render(<HealthCheckButton />);

  const button = screen.getByText(/check backend health/i);
  expect(button).toBeInTheDocument();

  const statusText = screen.queryByText(/Backend status:/i);
  expect(statusText).not.toBeInTheDocument();
});

test('2. Shows "ok" on successful API call', async () => {
  // Mock a successful fetch response
  global.fetch.mockResolvedValue({
    ok: true,
    // Use 'vi.fn' instead of 'jest.fn'
    json: vi.fn().mockResolvedValue({ status: 'ok' }),
  });

  const user = userEvent.setup();
  render(<HealthCheckButton />);

  // 1. Find and click the button
  const button = screen.getByText(/check backend health/i);
  await user.click(button);

  // 2. Wait for the status text to appear
  const statusText = await screen.findByText(/Backend status:/i);
  expect(statusText).toBeInTheDocument();

  // 3. Verify the status text and class
  const okStatus = screen.getByText('ok');
  expect(okStatus).toBeInTheDocument();
  expect(okStatus).toHaveClass('text-success');
});

test('3. Shows "error" on failed API call', async () => {
  // Mock a failed fetch response
  global.fetch.mockRejectedValue(new Error('Network failed'));

  const user = userEvent.setup();
  render(<HealthCheckButton />);

  // 1. Find and click the button
  const button = screen.getByText(/check backend health/i);
  await user.click(button);

  // 2. Wait for the status text to appear
  const statusText = await screen.findByText(/Backend status:/i);
  expect(statusText).toBeInTheDocument();

  // 3. Verify the status text and class
  const errorStatus = screen.getByText('error');
  expect(errorStatus).toBeInTheDocument();
  expect(errorStatus).toHaveClass('text-error');
});

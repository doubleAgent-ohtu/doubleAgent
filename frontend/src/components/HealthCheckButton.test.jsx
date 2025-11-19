import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import { HealthCheckButton } from './HealthCheckButton';

vi.mock('axios');

afterEach(() => {
  vi.resetAllMocks();
});

test('1. Renders button, but no initial status', () => {
  render(<HealthCheckButton />);

  const button = screen.getByText(/check backend health/i);
  expect(button).toBeInTheDocument();

  const statusText = screen.queryByText(/Backend status:/i);
  expect(statusText).not.toBeInTheDocument();
});

test('2. Shows "ok" on successful API call', async () => {
  axios.get.mockResolvedValue({ data: { status: 'ok' } });

  const user = userEvent.setup();
  render(<HealthCheckButton />);

  const button = screen.getByText(/check backend health/i);
  await user.click(button);

  const statusText = await screen.findByText(/Backend status:/i);
  expect(statusText).toBeInTheDocument();

  const okStatus = screen.getByText('ok');
  expect(okStatus).toBeInTheDocument();
  expect(okStatus).toHaveClass('text-success');
});

test('3. Shows "error" on failed API call', async () => {
  axios.get.mockRejectedValue(new Error('Network failed'));

  const user = userEvent.setup();
  render(<HealthCheckButton />);

  const button = screen.getByText(/check backend health/i);
  await user.click(button);

  const statusText = await screen.findByText(/Backend status:/i);
  expect(statusText).toBeInTheDocument();

  const errorStatus = screen.getByText('error');
  expect(errorStatus).toBeInTheDocument();
  expect(errorStatus).toHaveClass('text-error');
});

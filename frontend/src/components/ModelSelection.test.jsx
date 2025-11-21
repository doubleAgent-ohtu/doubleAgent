import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ModelSelection from './ModelSelection';

test('1. Renders select with label and options', () => {
  render(<ModelSelection selectedModel="gpt-4o" setSelectedModel={() => {}} />);

  const label = screen.getByText(/Model:/i);
  expect(label).toBeInTheDocument();

  const select = screen.getByRole('combobox');
  expect(select).toBeInTheDocument();

  expect(screen.getByRole('option', { name: 'GPT-4o' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'GPT-4o-mini' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'GPT-4.1' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'GPT-5' })).toBeInTheDocument();
});

test('2. Shows selected value from prop', () => {
  render(<ModelSelection selectedModel="gpt-4.1" setSelectedModel={() => {}} />);

  const select = screen.getByRole('combobox');
  expect(select).toHaveValue('gpt-4.1');
});

test('3. Calls setSelectedModel on change', async () => {
  const setSelectedModel = vi.fn();
  const user = userEvent.setup();

  render(<ModelSelection selectedModel="gpt-4o" setSelectedModel={setSelectedModel} />);

  const select = screen.getByRole('combobox');
  const option = screen.getByRole('option', { name: 'GPT-4.1' });

  await user.selectOptions(select, option);

  expect(setSelectedModel).toHaveBeenCalledTimes(1);
  expect(setSelectedModel).toHaveBeenCalledWith('gpt-4.1');
});

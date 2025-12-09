import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Conversation from './Conversation';

vi.mock('./third-party/Orb.jsx', () => ({
  default: () => <div data-testid="orb-mock">Orb Placeholder</div>,
}));

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

  expect(screen.getByText('Orb Placeholder')).toBeInTheDocument();
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

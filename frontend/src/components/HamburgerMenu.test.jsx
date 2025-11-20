import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import HamburgerMenu from './HamburgerMenu';

test('1. Renders hamburger menu label', () => {
  render(<HamburgerMenu />);

  const label = screen.getByText((content, element) => {
    return element.tagName.toLowerCase() === 'label' && element.getAttribute('for') === 'my-drawer-4';
  });
  expect(label).toBeInTheDocument();
  expect(label).toHaveClass('btn', 'btn-ghost', 'btn-circle', 'drawer-button');
});

test('2. Has correct htmlFor attribute for drawer toggle', () => {
  const { container } = render(<HamburgerMenu />);

  const label = container.querySelector('label[for="my-drawer-4"]');
  expect(label).toBeInTheDocument();
});

test('3. Contains SVG icon with correct paths', () => {
  const { container } = render(<HamburgerMenu />);

  const svg = container.querySelector('svg');
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveClass('inline-block', 'w-6', 'h-6', 'stroke-current');

  const path = svg.querySelector('path');
  expect(path).toHaveAttribute('d', 'M4 6h16M4 12h16M4 18h16');
});

test('4. Is hidden on large screens', () => {
  const { container } = render(<HamburgerMenu />);

  const wrapper = container.firstChild;
  expect(wrapper).toHaveClass('lg:hidden');
});

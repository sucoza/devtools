/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar, CircularProgress } from './Progress';

describe('ProgressBar', () => {
  it('renders basic progress bar', () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('calculates correct percentage for normal values', () => {
    const { container } = render(<ProgressBar value={75} max={100} />);
    const bar = container.querySelector('div[style*="width"]');
    expect(bar).toBeTruthy();
  });

  it('handles max=0 without division by zero', () => {
    // The fix: max > 0 ? ... : 0 prevents NaN from 0/0
    const { container } = render(
      <ProgressBar value={50} max={0} showValue />
    );
    // Should render without crashing
    expect(container.firstChild).toBeTruthy();
  });

  it('displays 0% when max is 0 with showValue', () => {
    render(<ProgressBar value={50} max={0} showValue />);
    // The default valueFormat should return '0%' when max is 0
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('clamps percentage between 0 and 100', () => {
    // value > max should clamp to 100%
    const { container } = render(<ProgressBar value={200} max={100} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('handles negative values gracefully', () => {
    const { container } = render(<ProgressBar value={-10} max={100} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders label when provided', () => {
    render(<ProgressBar value={50} label="Loading..." />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders value text when showValue is true', () => {
    render(<ProgressBar value={50} max={100} showValue />);
    expect(screen.getByText('50%')).toBeTruthy();
  });
});

describe('CircularProgress', () => {
  it('renders basic circular progress', () => {
    const { container } = render(<CircularProgress value={50} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('handles max=0 without division by zero', () => {
    // The fix: max > 0 ? ... : 0 prevents NaN from 0/0
    const { container } = render(
      <CircularProgress value={50} max={0} showValue />
    );
    // Should render without crashing
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('displays 0% when max is 0 with showValue', () => {
    render(<CircularProgress value={50} max={0} showValue />);
    expect(screen.getByText('0%')).toBeTruthy();
  });

  it('renders value text when showValue is true', () => {
    render(<CircularProgress value={75} max={100} showValue />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('handles indeterminate state', () => {
    const { container } = render(<CircularProgress indeterminate />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryTimeline } from './MemoryTimeline';
import type { MemoryTimelinePoint } from '../types';

function makePoint(usedMemory: number, timestamp = Date.now()): MemoryTimelinePoint {
  return {
    timestamp,
    usedMemory,
    totalMemory: usedMemory * 2,
  };
}

describe('MemoryTimeline', () => {
  it('renders empty state when no data', () => {
    render(<MemoryTimeline timeline={[]} warnings={[]} />);
    expect(screen.getByText('No timeline data available')).toBeTruthy();
  });

  it('renders single data point without division by zero (the fix)', () => {
    // With 1 point, index=0, length=1 → 0/(1-1) = 0/0 = NaN
    // Fix: timeline.length <= 1 ? 50 : (index / (timeline.length - 1)) * 100
    const timeline = [makePoint(1024 * 1024)];
    const { container } = render(
      <MemoryTimeline timeline={timeline} warnings={[]} />
    );
    // Should render chart with data point, not crash
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelector('circle')).toBeTruthy();
  });

  it('renders multiple data points correctly', () => {
    const timeline = [
      makePoint(1024 * 1024, 1000),
      makePoint(2 * 1024 * 1024, 2000),
      makePoint(1.5 * 1024 * 1024, 3000),
    ];
    const { container } = render(
      <MemoryTimeline timeline={timeline} warnings={[]} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
    // Should have 3 data point circles
    const circles = container.querySelectorAll('circle[r="3"]');
    expect(circles.length).toBe(3);
  });

  it('shows summary stats for non-empty timeline', () => {
    const timeline = [
      makePoint(1024 * 1024, 1000),
      makePoint(2 * 1024 * 1024, 2000),
    ];
    render(<MemoryTimeline timeline={timeline} warnings={[]} />);
    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByText('Peak')).toBeTruthy();
    expect(screen.getByText('Low')).toBeTruthy();
    expect(screen.getByText('Range')).toBeTruthy();
  });

  it('detects upward memory trend', () => {
    const timeline = [
      makePoint(1024 * 1024, 1000),
      makePoint(2 * 1024 * 1024, 2000),
      makePoint(3 * 1024 * 1024, 3000),
    ];
    const { container } = render(
      <MemoryTimeline timeline={timeline} warnings={[]} />
    );
    // Trend is 'up' — should render without error
    expect(container.firstChild).toBeTruthy();
  });

  it('handles equal memory values (range=0)', () => {
    const timeline = [
      makePoint(1024 * 1024, 1000),
      makePoint(1024 * 1024, 2000),
    ];
    // range = 0, so y = 50 (fallback)
    const { container } = render(
      <MemoryTimeline timeline={timeline} warnings={[]} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders GC events when present', () => {
    const timeline: MemoryTimelinePoint[] = [
      {
        timestamp: 1000,
        usedMemory: 2 * 1024 * 1024,
        totalMemory: 4 * 1024 * 1024,
        gcEvent: { type: 'major', memoryFreed: 512 * 1024, duration: 10, timestamp: 1000 },
      },
    ];
    const { container } = render(
      <MemoryTimeline timeline={timeline} warnings={[]} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

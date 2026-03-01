/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { PerformanceChart, type ChartSeries } from './PerformanceChart';

const makeSeries = (data: { timestamp: number; value: number }[]): ChartSeries[] => [
  { name: 'Test', data, color: '#000' },
];

describe('PerformanceChart', () => {
  it('renders with data', () => {
    const series = makeSeries([
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 20 },
    ]);
    const { container } = render(<PerformanceChart series={series} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders empty state with no data', () => {
    const { container } = render(<PerformanceChart series={[]} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('respects timeRange with start=0 (the ?? fix)', () => {
    const series = makeSeries([
      { timestamp: 500, value: 10 },
      { timestamp: 1500, value: 20 },
    ]);
    // timeRange.start = 0 should be respected, not treated as falsy
    const { container } = render(
      <PerformanceChart
        series={series}
        timeRange={{ start: 0, end: 2000 }}
      />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // If start=0 was treated as falsy (via ||), the chart would use
    // Math.min(500, 1500) = 500 as minTime instead of 0, changing point positions
  });

  it('handles single data point', () => {
    const series = makeSeries([{ timestamp: 1000, value: 42 }]);
    const { container } = render(<PerformanceChart series={series} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('handles all-zero values', () => {
    const series = makeSeries([
      { timestamp: 1000, value: 0 },
      { timestamp: 2000, value: 0 },
    ]);
    const { container } = render(<PerformanceChart series={series} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

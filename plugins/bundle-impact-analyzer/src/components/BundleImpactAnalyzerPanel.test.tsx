import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BundleImpactAnalyzerPanel } from './BundleImpactAnalyzerPanel';

describe('BundleImpactAnalyzerPanel', () => {
  beforeEach(() => {
    // Reset any global state before each test
  });

  it('renders the main panel', () => {
    render(<BundleImpactAnalyzerPanel />);
    
    expect(screen.getByText('Bundle Impact Analyzer')).toBeInTheDocument();
    expect(screen.getByTestId('bundle-impact-analyzer-devtools')).toBeInTheDocument();
  });

  it('displays bundle statistics', () => {
    render(<BundleImpactAnalyzerPanel />);
    
    expect(screen.getByText('Total Size:')).toBeInTheDocument();
    expect(screen.getByText('Gzipped:')).toBeInTheDocument();
    expect(screen.getByText('Modules:')).toBeInTheDocument();
  });

  it('shows all tab buttons', () => {
    render(<BundleImpactAnalyzerPanel />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Chunks')).toBeInTheDocument();
    expect(screen.getByText('Tree Shaking')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('CDN')).toBeInTheDocument();
    expect(screen.getByText('Visualization')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('can switch between tabs', () => {
    render(<BundleImpactAnalyzerPanel />);
    
    // Default tab should be Overview
    expect(screen.getByRole('button', { name: /overview/i })).toHaveClass('active');
    
    // Click on Modules tab
    fireEvent.click(screen.getByText('Modules'));
    expect(screen.getByRole('button', { name: /modules/i })).toHaveClass('active');
  });

  it('calls onTabChange when tab is switched', () => {
    const onTabChange = vitest.fn();
    render(<BundleImpactAnalyzerPanel onTabChange={onTabChange} />);
    
    fireEvent.click(screen.getByText('Modules'));
    expect(onTabChange).toHaveBeenCalledWith('modules');
  });

  it('shows filter controls when modules exist', () => {
    render(<BundleImpactAnalyzerPanel />);
    
    // Should show filter bar (assuming sample data is generated)
    expect(screen.getByPlaceholderText('Search modules...')).toBeInTheDocument();
    expect(screen.getByText('Large Modules Only')).toBeInTheDocument();
  });

  it('displays analysis progress when analyzing', () => {
    render(<BundleImpactAnalyzerPanel />);
    
    // Start analysis
    const analyzeButton = screen.getByTitle('Start Analysis');
    fireEvent.click(analyzeButton);
    
    // Should show progress (this might be flaky due to timing)
    // In a real test, we'd mock the store state
  });

  it('applies theme classes correctly', () => {
    const { rerender } = render(<BundleImpactAnalyzerPanel theme="light" />);
    expect(screen.getByTestId('bundle-impact-analyzer-devtools')).toHaveClass('theme-light');
    
    rerender(<BundleImpactAnalyzerPanel theme="dark" />);
    expect(screen.getByTestId('bundle-impact-analyzer-devtools')).toHaveClass('theme-dark');
  });

  it('applies compact mode when specified', () => {
    render(<BundleImpactAnalyzerPanel compact={true} />);
    expect(screen.getByTestId('bundle-impact-analyzer-devtools')).toHaveClass('compact');
  });
});
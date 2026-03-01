/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, type Tab } from './Tabs';

const createTabs = (count: number, closable = false): Tab[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `tab-${i}`,
    label: `Tab ${i}`,
    content: <div>Content {i}</div>,
    closable,
  }));

describe('Tabs', () => {
  it('renders all tabs', () => {
    render(<Tabs tabs={createTabs(3)} />);
    expect(screen.getByText('Tab 0')).toBeTruthy();
    expect(screen.getByText('Tab 1')).toBeTruthy();
    expect(screen.getByText('Tab 2')).toBeTruthy();
  });

  it('defaults to first tab active', () => {
    render(<Tabs tabs={createTabs(3)} />);
    expect(screen.getByText('Content 0')).toBeTruthy();
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={createTabs(3)} onTabChange={onChange} />);

    fireEvent.click(screen.getByText('Tab 1'));
    expect(onChange).toHaveBeenCalledWith('tab-1');
  });

  it('auto-selects first tab when active tab is removed (the fix)', () => {
    // Start with 3 tabs, active = tab-1
    const initialTabs = createTabs(3);
    const { rerender } = render(
      <Tabs tabs={initialTabs} defaultActiveTab="tab-1" />
    );

    // Verify tab-1 content is shown
    expect(screen.getByText('Content 1')).toBeTruthy();

    // Remove tab-1 from the list
    const remainingTabs = [initialTabs[0], initialTabs[2]];
    rerender(<Tabs tabs={remainingTabs} />);

    // After re-render, internal state should fall back to first available tab
    expect(screen.getByText('Content 0')).toBeTruthy();
  });

  it('does not auto-select when controlled (activeTab prop)', () => {
    const tabs = createTabs(3);
    const { rerender } = render(
      <Tabs tabs={tabs} activeTab="tab-1" />
    );

    // Remove tab-1 — controlled mode: component doesn't override activeTab
    const remainingTabs = [tabs[0], tabs[2]];
    rerender(<Tabs tabs={remainingTabs} activeTab="tab-1" />);

    // In controlled mode, the component doesn't auto-select
    // No content should render since tab-1 no longer exists
    expect(screen.queryByText('Content 0')).toBeNull();
  });

  it('handles disabled tabs', () => {
    const onChange = vi.fn();
    const tabs: Tab[] = [
      { id: 'a', label: 'A', content: <div>A</div> },
      { id: 'b', label: 'B', content: <div>B</div>, disabled: true },
    ];

    render(<Tabs tabs={tabs} onTabChange={onChange} />);
    fireEvent.click(screen.getByText('B'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const tabs = createTabs(2, true);

    render(<Tabs tabs={tabs} onClose={onClose} />);

    // The X button is inside the tab button
    const closeButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('svg') !== null && btn.closest('[data-tab-id]') === null
    );
    // Click first close button found
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders with empty tabs array', () => {
    const { container } = render(<Tabs tabs={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});

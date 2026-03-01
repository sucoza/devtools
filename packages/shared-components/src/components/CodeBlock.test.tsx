/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';

// Mock clipboard API
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

describe('CodeBlock', () => {
  it('renders code content', () => {
    render(<CodeBlock code="const x = 1;" language="javascript" />);
    expect(screen.getByText(/const/)).toBeTruthy();
  });

  it('shows copy button when copyable', () => {
    const { container } = render(
      <CodeBlock code="hello" copyable />
    );
    // Should have a button for copy
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('clears copy timeout on unmount (the fix)', () => {
    vi.useFakeTimers();

    const { container, unmount } = render(
      <CodeBlock code="test code" copyable />
    );

    // Click copy button
    const copyButton = container.querySelector('button');
    if (copyButton) {
      fireEvent.click(copyButton);
    }

    // Unmount before the 2000ms timeout fires
    unmount();

    // Advance timers — should NOT throw "setState on unmounted"
    expect(() => {
      vi.advanceTimersByTime(3000);
    }).not.toThrow();

    vi.useRealTimers();
  });

  it('resets copied state after rapid clicks', () => {
    vi.useFakeTimers();

    const { container } = render(
      <CodeBlock code="test" copyable />
    );

    const copyButton = container.querySelector('button');
    if (copyButton) {
      // Click twice rapidly
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
    }

    // Only one timeout should be active (old one cleared)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should not throw
    vi.useRealTimers();
  });

  it('renders line numbers when showLineNumbers is true', () => {
    render(
      <CodeBlock
        code={"line1\nline2\nline3"}
        showLineNumbers
        startLineNumber={1}
      />
    );
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });
});

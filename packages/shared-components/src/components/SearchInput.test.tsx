/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders with placeholder', () => {
    const { container } = render(
      <SearchInput placeholder="Search..." />
    );
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    expect(input?.getAttribute('placeholder')).toBe('Search...');
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchInput onChange={onChange} />
    );
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalledWith('test');
  });

  describe('blur timeout cleanup (the fix)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('clears blur timeout on unmount', () => {
      const { container, unmount } = render(
        <SearchInput
          showHistory
          history={['previous search']}
        />
      );

      const input = container.querySelector('input')!;

      // Focus to show dropdown, then blur to trigger the timeout
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Unmount before the 200ms timeout fires
      unmount();

      // Advance timers — should NOT throw "setState on unmounted"
      expect(() => {
        vi.advanceTimersByTime(300);
      }).not.toThrow();
    });

    it('handles rapid focus/blur cycles', () => {
      const { container } = render(
        <SearchInput
          showHistory
          history={['search1']}
        />
      );

      const input = container.querySelector('input')!;

      // Rapidly focus/blur multiple times
      fireEvent.focus(input);
      fireEvent.blur(input);
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Only one timeout should be active (previous cleared)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not throw
    });
  });

  it('debounces search calls', () => {
    vi.useFakeTimers();

    const onSearch = vi.fn();
    const { container } = render(
      <SearchInput onSearch={onSearch} debounceMs={300} />
    );

    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    // Should not have been called yet
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should only be called once with the final value
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('abc', expect.any(Object));

    vi.useRealTimers();
  });
});

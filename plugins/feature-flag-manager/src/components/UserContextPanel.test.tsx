import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { UserContextPanel } from './UserContextPanel';
import type { EvaluationContext, UserSegment } from '../types/feature-flags';

const defaultContext: EvaluationContext = {
  userId: 'user-1',
  sessionId: 'session-1',
  environment: 'development',
  userSegment: undefined,
  attributes: { plan: 'free' },
};

const segments: UserSegment[] = [
  {
    id: 'beta',
    name: 'Beta Users',
    description: 'Users in the beta program',
    rules: [{ attribute: 'plan', operator: 'equals', values: ['beta'] }],
  },
  {
    id: 'premium',
    name: 'Premium Users',
    description: 'Paying users',
    rules: [{ attribute: 'plan', operator: 'equals', values: ['premium'] }],
  },
];

describe('UserContextPanel – context sync fix', () => {
  // --- Renders with initial context values ---

  it('renders with initial context values in the inputs', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UserContextPanel context={defaultContext} segments={segments} onChange={onChange} />,
    );

    const userIdInput = container.querySelector('input[value="user-1"]');
    expect(userIdInput).not.toBeNull();

    const sessionInput = container.querySelector('input[value="session-1"]');
    expect(sessionInput).not.toBeNull();
  });

  // --- When context prop changes, editedContext updates (the fix) ---

  it('updates editedContext when context prop changes', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <UserContextPanel context={defaultContext} segments={segments} onChange={onChange} />,
    );

    // Verify initial userId
    let userIdInput = container.querySelector('input[value="user-1"]');
    expect(userIdInput).not.toBeNull();

    // Rerender with a new context (simulating parent state change)
    const updatedContext: EvaluationContext = {
      ...defaultContext,
      userId: 'user-2',
      sessionId: 'session-2',
      environment: 'production',
    };

    rerender(
      <UserContextPanel context={updatedContext} segments={segments} onChange={onChange} />,
    );

    // The input should now reflect the new userId from the prop
    userIdInput = container.querySelector('input[value="user-2"]');
    expect(userIdInput).not.toBeNull();

    const sessionInput = container.querySelector('input[value="session-2"]');
    expect(sessionInput).not.toBeNull();
  });

  // --- Reset button restores to current context prop ---

  it('resets editedContext to the current context prop on reset', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UserContextPanel context={defaultContext} segments={segments} onChange={onChange} />,
    );

    // Modify the User ID field
    const inputs = container.querySelectorAll('input.context-input');
    // First text input is User ID
    const userIdInput = inputs[0] as HTMLInputElement;
    fireEvent.change(userIdInput, { target: { value: 'modified-user' } });
    expect(userIdInput.value).toBe('modified-user');

    // Click the Reset button
    const resetButton = container.querySelector('.reset-button') as HTMLButtonElement;
    expect(resetButton).not.toBeNull();
    fireEvent.click(resetButton);

    // After reset, the input should revert to the original context prop value
    expect(userIdInput.value).toBe('user-1');
  });

  // --- Segments render ---

  it('renders segment buttons from the segments prop', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UserContextPanel context={defaultContext} segments={segments} onChange={onChange} />,
    );

    const segmentButtons = container.querySelectorAll('.segment-button');
    expect(segmentButtons.length).toBe(2);
    expect(segmentButtons[0].textContent).toBe('Beta Users');
    expect(segmentButtons[1].textContent).toBe('Premium Users');
  });

  // --- Apply changes calls onChange ---

  it('calls onChange with edited context when Apply Changes is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UserContextPanel context={defaultContext} segments={segments} onChange={onChange} />,
    );

    // Edit user ID
    const inputs = container.querySelectorAll('input.context-input');
    const userIdInput = inputs[0] as HTMLInputElement;
    fireEvent.change(userIdInput, { target: { value: 'new-user' } });

    // Click Apply Changes
    const applyButton = container.querySelector('.apply-button') as HTMLButtonElement;
    fireEvent.click(applyButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'new-user' }),
    );
  });
});

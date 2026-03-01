import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal – unique aria IDs', () => {
  // --- Basic aria-labelledby with title ---

  it('renders with aria-labelledby pointing to the title element', () => {
    const { container } = render(
      <Modal open={true} title="Test Title" animate={false}>
        <p>Content</p>
      </Modal>,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    const labelledBy = dialog!.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    // The title element should exist and share the same id
    const titleEl = container.querySelector(`#${labelledBy}`);
    expect(titleEl).not.toBeNull();
    expect(titleEl!.textContent).toBe('Test Title');
  });

  // --- aria-describedby with description ---

  it('renders with aria-describedby pointing to the description element', () => {
    const { container } = render(
      <Modal open={true} title="Title" description="A description" animate={false}>
        <p>Content</p>
      </Modal>,
    );

    const dialog = container.querySelector('[role="dialog"]');
    const describedBy = dialog!.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const descEl = container.querySelector(`#${describedBy}`);
    expect(descEl).not.toBeNull();
    expect(descEl!.textContent).toBe('A description');
  });

  // --- Two simultaneous modals have different aria IDs (the fix) ---

  it('assigns different aria IDs to two simultaneously rendered modals', () => {
    const { container } = render(
      <>
        <Modal open={true} title="Modal One" description="Desc One" animate={false}>
          <p>First</p>
        </Modal>
        <Modal open={true} title="Modal Two" description="Desc Two" animate={false}>
          <p>Second</p>
        </Modal>
      </>,
    );

    const dialogs = container.querySelectorAll('[role="dialog"]');
    expect(dialogs.length).toBe(2);

    const id1 = dialogs[0].getAttribute('aria-labelledby');
    const id2 = dialogs[1].getAttribute('aria-labelledby');

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);

    // Also verify describedby IDs are unique
    const desc1 = dialogs[0].getAttribute('aria-describedby');
    const desc2 = dialogs[1].getAttribute('aria-describedby');

    expect(desc1).toBeTruthy();
    expect(desc2).toBeTruthy();
    expect(desc1).not.toBe(desc2);

    // Each ID should correctly reference its own title/description
    expect(container.querySelector(`#${id1}`)!.textContent).toBe('Modal One');
    expect(container.querySelector(`#${id2}`)!.textContent).toBe('Modal Two');
    expect(container.querySelector(`#${desc1}`)!.textContent).toBe('Desc One');
    expect(container.querySelector(`#${desc2}`)!.textContent).toBe('Desc Two');
  });

  // --- Modal without title has no aria-labelledby ---

  it('does not set aria-labelledby when title is not provided', () => {
    const { container } = render(
      <Modal open={true} animate={false}>
        <p>Content only</p>
      </Modal>,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('aria-labelledby')).toBeNull();
  });

  // --- Modal without description has no aria-describedby ---

  it('does not set aria-describedby when description is not provided', () => {
    const { container } = render(
      <Modal open={true} title="Title Only" animate={false}>
        <p>Content</p>
      </Modal>,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog!.getAttribute('aria-describedby')).toBeNull();
  });

  // --- Closed modal renders nothing ---

  it('renders nothing when open is false', () => {
    const { container } = render(
      <Modal open={false} title="Hidden" animate={false}>
        <p>Not visible</p>
      </Modal>,
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });
});

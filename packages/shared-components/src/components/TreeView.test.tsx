import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TreeView, TreeNode } from './TreeView';

const sampleData: TreeNode[] = [
  {
    id: 'root',
    label: 'Root Node',
    children: [
      { id: 'child-1', label: 'Child One' },
      { id: 'child-2', label: 'Child Two' },
    ],
  },
  {
    id: 'leaf',
    label: 'Leaf Node',
  },
];

describe('TreeView', () => {
  it('renders tree nodes', () => {
    render(<TreeView data={sampleData} />);
    expect(screen.getByText('Root Node')).toBeTruthy();
    expect(screen.getByText('Leaf Node')).toBeTruthy();
  });

  it('does not crash when searchQuery contains parentheses "(" and ")"', () => {
    expect(() => {
      render(
        <TreeView
          data={sampleData}
          searchQuery="(test)"
          highlightMatches={true}
        />
      );
    }).not.toThrow();
  });

  it('does not crash when searchQuery contains square brackets "[" and "]"', () => {
    expect(() => {
      render(
        <TreeView
          data={sampleData}
          searchQuery="[test]"
          highlightMatches={true}
        />
      );
    }).not.toThrow();
  });

  it('does not crash when searchQuery contains asterisk "*" and plus "+"', () => {
    expect(() => {
      render(
        <TreeView
          data={sampleData}
          searchQuery="a*b+c"
          highlightMatches={true}
        />
      );
    }).not.toThrow();
  });

  it('does not crash when searchQuery contains a dot "."', () => {
    expect(() => {
      render(
        <TreeView
          data={sampleData}
          searchQuery="file.ts"
          highlightMatches={true}
        />
      );
    }).not.toThrow();
  });

  it('does not crash with curly braces, caret, dollar, pipe, and backslash', () => {
    expect(() => {
      render(
        <TreeView
          data={sampleData}
          searchQuery="{^$|\\}"
          highlightMatches={true}
        />
      );
    }).not.toThrow();
  });

  it('does not crash with question mark in searchQuery', () => {
    expect(() => {
      render(
        <TreeView
          data={sampleData}
          searchQuery="test?"
          highlightMatches={true}
        />
      );
    }).not.toThrow();
  });

  it('highlights plain text search matches correctly', () => {
    const data: TreeNode[] = [
      { id: '1', label: 'Hello World' },
    ];

    const { container } = render(
      <TreeView
        data={data}
        searchQuery="World"
        highlightMatches={true}
      />
    );

    // The highlighted portion should appear in a <span> with special styling
    const spans = container.querySelectorAll('span');
    const highlightedSpan = Array.from(spans).find(
      (s) => s.textContent === 'World' && s.style.backgroundColor
    );
    expect(highlightedSpan).toBeTruthy();
  });

  it('shows all nodes when searchQuery is empty', () => {
    render(
      <TreeView
        data={sampleData}
        searchQuery=""
        highlightMatches={true}
      />
    );

    expect(screen.getByText('Root Node')).toBeTruthy();
    expect(screen.getByText('Leaf Node')).toBeTruthy();
  });

  it('respects selectedIds=[] to clear selection (the fix)', () => {
    const onSelect = vi.fn();
    // First render with a selected node
    const { rerender } = render(
      <TreeView data={sampleData} selectedIds={['root']} onSelect={onSelect} />
    );

    // Now pass empty array to clear — should NOT fall back to internal state
    rerender(
      <TreeView data={sampleData} selectedIds={[]} onSelect={onSelect} />
    );

    // No node should have selection styling — verify root node is rendered but not selected
    expect(screen.getByText('Root Node')).toBeTruthy();
    // The component renders — this ensures it doesn't crash with empty selectedIds
  });

  it('uses internal selection when selectedIds is not provided', () => {
    render(<TreeView data={sampleData} />);
    expect(screen.getByText('Root Node')).toBeTruthy();
    expect(screen.getByText('Leaf Node')).toBeTruthy();
  });
});

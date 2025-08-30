/**
 * Comments Panel Component
 * Interface for viewing and managing test comments and discussions
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { BrowserAutomationState } from '../../types';

export interface CommentsPanelProps {
  state: BrowserAutomationState;
  dispatch: (action: unknown) => void;
  compact?: boolean;
  searchQuery?: string;
  selectedTestId?: string | null;
  onTestSelect?: (testId: string) => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ state: _state, dispatch: _dispatch }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Comments & Discussions</h3>
        <p className="text-gray-600">View and manage comments on test recordings.</p>
      </div>
    </div>
  );
};
/**
 * Reviews Panel Component
 * Interface for managing test reviews and approval workflows
 */

import React from 'react';
import { CheckSquare } from 'lucide-react';
import type { BrowserAutomationState } from '../../types';

export interface ReviewsPanelProps {
  state: BrowserAutomationState;
  dispatch: (action: unknown) => void;
  compact?: boolean;
  searchQuery?: string;
  selectedTestId?: string | null;
  onTestSelect?: (testId: string) => void;
}

export const ReviewsPanel: React.FC<ReviewsPanelProps> = ({ _state, _dispatch }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews & Approvals</h3>
        <p className="text-gray-600">Manage test reviews and approval workflows.</p>
      </div>
    </div>
  );
};
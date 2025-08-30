/**
 * Activity Panel Component
 * Interface for viewing team activity feed and notifications
 */

import React from 'react';
import { Activity } from 'lucide-react';
import type { BrowserAutomationState } from '../../types';

export interface ActivityPanelProps {
  state: BrowserAutomationState;
  dispatch: (action: unknown) => void;
  compact?: boolean;
  searchQuery?: string;
  selectedTestId?: string | null;
  onTestSelect?: (testId: string) => void;
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ state: _state, dispatch: _dispatch }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <Activity size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Team Activity</h3>
        <p className="text-gray-600">View recent team activity and notifications.</p>
      </div>
    </div>
  );
};
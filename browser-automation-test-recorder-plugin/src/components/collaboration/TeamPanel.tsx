/**
 * Team Panel Component
 * Interface for team management and member administration
 */

import React from 'react';
import { Users } from 'lucide-react';
import type { BrowserAutomationState } from '../../types';

export interface TeamPanelProps {
  state: BrowserAutomationState;
  dispatch: (action: any) => void;
  compact?: boolean;
  searchQuery?: string;
  selectedTestId?: string | null;
  onTestSelect?: (testId: string) => void;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ state, dispatch }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div>
        <Users size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Team Management</h3>
        <p className="text-gray-600">Manage team members, roles, and permissions.</p>
      </div>
    </div>
  );
};
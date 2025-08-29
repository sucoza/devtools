/**
 * Collaboration Tab Component
 * Main interface for team collaboration features including sharing, library, comments, and reviews
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Share2,
  Library,
  MessageSquare,
  CheckSquare,
  Users,
  Activity,
  Search,
  Filter,
  Plus,
  Settings,
  Bell,
  Upload,
  Download
} from 'lucide-react';

import type {
  CollaborationUser,
  CollaborationTeam,
  SharedTestRecording,
  TestLibrary,
  TestComment,
  TestReview,
  CollaborationState,
  BrowserAutomationState
} from '../../types';

import { LibraryPanel } from '../collaboration/LibraryPanel';
import { SharedTestsPanel } from '../collaboration/SharedTestsPanel';
import { CommentsPanel } from '../collaboration/CommentsPanel';
import { ReviewsPanel } from '../collaboration/ReviewsPanel';
import { TeamPanel } from '../collaboration/TeamPanel';
import { ActivityPanel } from '../collaboration/ActivityPanel';
import { ShareDialog } from '../collaboration/ShareDialog';
import { NotificationCenter } from '../collaboration/NotificationCenter';

export interface CollaborationTabProps {
  state: BrowserAutomationState;
  dispatch: (action: any) => void;
  compact?: boolean;
}

/**
 * Main Collaboration Tab Component
 */
export const CollaborationTab: React.FC<CollaborationTabProps> = ({
  state,
  dispatch,
  compact = false
}) => {
  // Local state
  const [activePanel, setActivePanel] = useState<string>('library');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const collaboration = state.collaboration;
  const isConnected = collaboration?.sync?.isConnected ?? false;
  const currentUser = collaboration?.currentUser;
  const currentTeam = collaboration?.currentTeam;

  // Handle panel switching
  const handlePanelChange = (panel: string) => {
    setActivePanel(panel);
    dispatch({
      type: 'collaboration/ui/panel/set',
      payload: panel
    });
  };

  // Handle share current recording
  const handleShareRecording = () => {
    if (state.events.length === 0) {
      alert('No events to share. Please record some actions first.');
      return;
    }
    setShowShareDialog(true);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    dispatch({
      type: 'collaboration/search/update',
      payload: query
    });
  };

  // Render connection status
  const renderConnectionStatus = () => (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-2 text-xs rounded',
      isConnected
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    )}>
      <div
        className={clsx(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-yellow-500'
        )}
      />
      {isConnected ? 'Connected' : 'Offline'}
      {currentTeam && (
        <span className="ml-2">• {currentTeam.name}</span>
      )}
    </div>
  );

  // Render panel navigation
  const renderPanelNavigation = () => {
    const panels: Array<{
      id: string;
      label: string;
      icon: React.ComponentType<any>;
      badge?: number;
    }> = [
      {
        id: 'library',
        label: 'Library',
        icon: Library,
        badge: collaboration?.library?.stats?.totalTests
      },
      {
        id: 'shared',
        label: 'Shared',
        icon: Share2,
        badge: collaboration?.sharedTests?.length
      },
      {
        id: 'comments',
        label: 'Comments',
        icon: MessageSquare,
        badge: collaboration?.comments?.filter(c => !c.parentId).length
      },
      {
        id: 'reviews',
        label: 'Reviews',
        icon: CheckSquare,
        badge: collaboration?.reviews?.filter(r => r.status === 'pending').length
      },
      {
        id: 'team',
        label: 'Team',
        icon: Users,
        badge: currentTeam?.members?.length
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: Activity,
        badge: collaboration?.notifications?.filter(n => !n.read).length
      }
    ];

    return (
      <nav className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg">
        {panels.map(panel => {
          const Icon = panel.icon;
          const isActive = activePanel === panel.id;

          return (
            <button
              key={panel.id}
              onClick={() => handlePanelChange(panel.id)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors relative',
                isActive
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              )}
            >
              <Icon size={16} />
              {!compact && panel.label}
              {panel.badge && panel.badge > 0 && (
                <span
                  className={clsx(
                    'absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {panel.badge > 99 ? '99+' : panel.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    );
  };

  // Render action bar
  const renderActionBar = () => (
    <div className="flex items-center justify-between gap-2 p-2">
      {/* Search */}
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search tests, comments, or users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleShareRecording}
          disabled={state.events.length === 0}
          className={clsx(
            'p-2 rounded-md transition-colors',
            state.events.length > 0
              ? 'text-blue-600 hover:bg-blue-50'
              : 'text-gray-400 cursor-not-allowed'
          )}
          title="Share current recording"
        >
          <Upload size={16} />
        </button>

        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          title="Notifications"
        >
          <Bell size={16} />
          {collaboration?.notifications?.filter(n => !n.read).length > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <button
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          title="Collaboration settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );

  // Render active panel content
  const renderPanelContent = () => {
    if (!currentUser) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sign in to Collaborate
            </h3>
            <p className="text-gray-600 mb-4">
              Join your team to share tests, leave comments, and collaborate on test automation.
            </p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => {
                // Handle sign in
                console.log('Sign in clicked');
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    const commonProps = {
      state,
      dispatch,
      compact,
      searchQuery,
      selectedTestId,
      onTestSelect: setSelectedTestId
    };

    switch (activePanel) {
      case 'library':
        return <LibraryPanel {...commonProps} />;
      case 'shared':
        return <SharedTestsPanel {...commonProps} />;
      case 'comments':
        return <CommentsPanel {...commonProps} />;
      case 'reviews':
        return <ReviewsPanel {...commonProps} />;
      case 'team':
        return <TeamPanel {...commonProps} />;
      case 'activity':
        return <ActivityPanel {...commonProps} />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Panel not implemented: {activePanel}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Collaboration
          </h2>
          {renderConnectionStatus()}
        </div>
        
        {/* Panel navigation */}
        {renderPanelNavigation()}
      </div>

      {/* Action bar */}
      {renderActionBar()}

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {renderPanelContent()}
      </div>

      {/* Dialogs */}
      {showShareDialog && (
        <ShareDialog
          events={state.events}
          onClose={() => setShowShareDialog(false)}
          onShare={(sharedTest) => {
            dispatch({
              type: 'collaboration/share/create',
              payload: sharedTest
            });
            setShowShareDialog(false);
          }}
        />
      )}

      {showNotifications && (
        <NotificationCenter
          notifications={collaboration?.notifications || []}
          onClose={() => setShowNotifications(false)}
          onNotificationRead={(id) => {
            dispatch({
              type: 'collaboration/notification/mark-read',
              payload: id
            });
          }}
        />
      )}
    </div>
  );
};
/**
 * Shared Tests Panel Component
 * Interface for viewing and managing shared test recordings
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Share2,
  Download,
  GitBranch,
  MoreVertical,
  Globe,
  Users,
  Lock,
  Calendar,
  User,
  MessageSquare,
  Play,
  Edit,
  Trash2,
  Link
} from 'lucide-react';

import type {
  BrowserAutomationState,
  SharedTestRecording,
  SharingSettings
} from '../../types';

export interface SharedTestsPanelProps {
  state: BrowserAutomationState;
  dispatch: (action: unknown) => void;
  compact?: boolean;
  searchQuery?: string;
  selectedTestId?: string | null;
  onTestSelect?: (testId: string) => void;
}

/**
 * Shared Tests Panel Component
 */
export const SharedTestsPanel: React.FC<SharedTestsPanelProps> = ({
  state,
  dispatch,
  _compact = false,
  searchQuery = '',
  selectedTestId,
  onTestSelect
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mine' | 'shared' | 'public'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'popularity'>('updated');

  const sharedTests = state.collaboration?.sharedTests || [];
  const currentUser = state.collaboration?.currentUser;

  // Filter and sort tests
  const filteredTests = sharedTests.filter(test => {
    // Search filter
    if (searchQuery && !test.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !test.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Ownership/visibility filter
    switch (selectedFilter) {
      case 'mine':
        return test.createdBy === currentUser?.id;
      case 'shared':
        return test.sharing.visibility === 'team';
      case 'public':
        return test.sharing.visibility === 'public';
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (sortBy) {
      case 'created':
        return b.createdAt - a.createdAt;
      case 'updated':
        return b.updatedAt - a.updatedAt;
      case 'popularity':
        // Would use actual popularity metrics
        return b.comments.length - a.comments.length;
      default:
        return 0;
    }
  });

  // Handle test action
  const handleTestAction = async (test: SharedTestRecording, action: string) => {
    switch (action) {
      case 'view':
        onTestSelect?.(test.id);
        break;
      case 'play':
        // Load test for playback
        dispatch({
          type: 'collaboration/test/load',
          payload: test
        });
        break;
      case 'fork':
        // Fork the test
        dispatch({
          type: 'collaboration/test/fork',
          payload: test.id
        });
        break;
      case 'copy-link': {
        // Copy share link
        const shareUrl = `${window.location.origin}/shared/${test.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        // Show toast notification
        break;
      }
      case 'download':
        // Download test
        dispatch({
          type: 'collaboration/test/download',
          payload: { testId: test.id, format: 'json' }
        });
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this shared test?')) {
          dispatch({
            type: 'collaboration/test/delete',
            payload: test.id
          });
        }
        break;
    }
  };

  // Get visibility icon
  const getVisibilityIcon = (sharing: SharingSettings) => {
    switch (sharing.visibility) {
      case 'public':
        return <Globe size={16} className="text-green-600" />;
      case 'team':
        return <Users size={16} className="text-blue-600" />;
      case 'private':
        return <Lock size={16} className="text-gray-600" />;
    }
  };

  // Render test card
  const renderTestCard = (test: SharedTestRecording) => {
    const isSelected = selectedTestId === test.id;
    const isOwner = test.createdBy === currentUser?.id;

    return (
      <div
        key={test.id}
        onClick={() => onTestSelect?.(test.id)}
        className={clsx(
          'bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md',
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getVisibilityIcon(test.sharing)}
              <h3 className="font-medium text-gray-900 truncate">
                {test.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {test.description || 'No description provided'}
            </p>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreVertical size={16} />
            </button>
            {/* Dropdown menu would be implemented here */}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-500 mb-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Play size={12} />
              {test.metadata.eventCount} events
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(test.updatedAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User size={12} />
              {isOwner ? 'You' : test.createdBy}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {test.comments.length} comments
            </span>
          </div>
        </div>

        {/* Tags */}
        {test.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {test.metadata.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
            {test.metadata.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{test.metadata.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTestAction(test, 'play');
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Load for playback"
            >
              <Play size={16} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTestAction(test, 'fork');
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Fork test"
            >
              <GitBranch size={16} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTestAction(test, 'copy-link');
              }}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="Copy share link"
            >
              <Link size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTestAction(test, 'download');
              }}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="Download"
            >
              <Download size={16} />
            </button>

            {isOwner && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open edit dialog
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestAction(test, 'delete');
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sign in to view shared tests
          </h3>
          <p className="text-gray-600">
            Access your shared tests and collaborate with your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Shared Tests
            </h3>
            <p className="text-sm text-gray-600">
              {filteredTests.length} of {sharedTests.length} tests
            </p>
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created' | 'updated' | 'popularity')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>

        {/* Filter tabs */}
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Tests', count: sharedTests.length },
            { id: 'mine', label: 'My Tests', count: sharedTests.filter(t => t.createdBy === currentUser?.id).length },
            { id: 'shared', label: 'Team Shared', count: sharedTests.filter(t => t.sharing.visibility === 'team').length },
            { id: 'public', label: 'Public', count: sharedTests.filter(t => t.sharing.visibility === 'public').length }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id as 'all' | 'mine' | 'shared' | 'public')}
              className={clsx(
                'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                selectedFilter === filter.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  ({filter.count})
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredTests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No shared tests found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Share your first test recording to get started.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    // Trigger share dialog
                    dispatch({ type: 'ui/share-dialog/open' });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Share a Test
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredTests.map(renderTestCard)}
          </div>
        )}
      </div>
    </div>
  );
};
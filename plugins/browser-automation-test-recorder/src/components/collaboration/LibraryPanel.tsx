/**
 * Library Panel Component
 * Interface for browsing and managing team test library
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Library,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  GitBranch,
  MoreVertical,
  Plus,
  Grid,
  List,
  User
} from 'lucide-react';

import type {
  BrowserAutomationState,
  LibraryTestStatus,
} from '../../types';

export interface LibraryPanelProps {
  state: BrowserAutomationState;
  dispatch: (action: unknown) => void;
  compact?: boolean;
  searchQuery?: string;
  selectedTestId?: string | null;
  onTestSelect?: (testId: string) => void;
}

/**
 * Test Library Panel Component
 */
export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  state,
  dispatch,
  compact: _compact = false,
  searchQuery = '',
  selectedTestId,
  onTestSelect
}) => {
  // Local state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<LibraryTestStatus[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'popularity' | 'quality'>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const library = state.collaboration?.library;
  const tests = library?.tests || [];
  const categories = library?.categories || [];

  // Filter and sort tests
  const filteredTests = tests.filter(test => {
    // Search query
    if (searchQuery && !test.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !test.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !test.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(test.category)) {
      return false;
    }

    // Tag filter
    if (selectedTags.length > 0 && !selectedTags.some(tag => test.tags.includes(tag))) {
      return false;
    }

    // Status filter
    if (selectedStatus.length > 0 && !selectedStatus.includes(test.status)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.createdAt - a.createdAt;
      case 'updated':
        return b.updatedAt - a.updatedAt;
      case 'popularity':
        return b.usage.popularityScore - a.usage.popularityScore;
      case 'quality':
        return b.quality.overallScore - a.quality.overallScore;
      default:
        return 0;
    }
  });

  // Get popular tags
  const popularTags = Array.from(
    new Set(tests.flatMap(test => test.tags))
  ).slice(0, 20);

  // Handle test selection
  const handleTestSelect = (test: LibraryTest) => {
    onTestSelect?.(test.id);
    dispatch({
      type: 'collaboration/test/select',
      payload: test.id
    });
  };

  // Handle test action
  const handleTestAction = (test: LibraryTest, action: 'view' | 'download' | 'fork' | 'star') => {
    switch (action) {
      case 'view':
        // Open test details
        break;
      case 'download':
        // Download test
        dispatch({
          type: 'collaboration/test/download',
          payload: test.id
        });
        break;
      case 'fork':
        // Fork test
        dispatch({
          type: 'collaboration/test/fork',
          payload: test.id
        });
        break;
      case 'star':
        // Star/unstar test
        dispatch({
          type: 'collaboration/test/star',
          payload: test.id
        });
        break;
    }
  };

  // Render category filter
  const renderCategoryFilter = () => (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
      <div className="flex flex-wrap gap-1">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategories(prev =>
                prev.includes(category.id)
                  ? prev.filter(id => id !== category.id)
                  : [...prev, category.id]
              );
            }}
            className={clsx(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              selectedCategories.includes(category.id)
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span
              className="w-2 h-2 rounded-full inline-block mr-2"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
            <span className="ml-1 text-xs opacity-70">
              ({category.testCount})
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Render tag filter
  const renderTagFilter = () => (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Popular Tags</h4>
      <div className="flex flex-wrap gap-1">
        {popularTags.map(tag => (
          <button
            key={tag}
            onClick={() => {
              setSelectedTags(prev =>
                prev.includes(tag)
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              );
            }}
            className={clsx(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              selectedTags.includes(tag)
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );

  // Render status filter
  const renderStatusFilter = () => {
    const statuses: LibraryTestStatus[] = ['published', 'review', 'draft', 'archived'];

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Status</h4>
        <div className="flex flex-wrap gap-1">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(prev =>
                  prev.includes(status)
                    ? prev.filter(s => s !== status)
                    : [...prev, status]
                );
              }}
              className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize',
                selectedStatus.includes(status)
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render test card (grid view)
  const renderTestCard = (test: LibraryTest) => {
    const isSelected = selectedTestId === test.id;

    return (
      <div
        key={test.id}
        onClick={() => handleTestSelect(test)}
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
            <h3 className="font-medium text-gray-900 truncate mb-1">
              {test.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {test.description || 'No description'}
            </p>
          </div>
          <div className="ml-2 flex items-center gap-1">
            <span className={clsx(
              'px-2 py-1 rounded-full text-xs font-medium capitalize',
              test.status === 'published' && 'bg-green-100 text-green-700',
              test.status === 'review' && 'bg-yellow-100 text-yellow-700',
              test.status === 'draft' && 'bg-gray-100 text-gray-700',
              test.status === 'archived' && 'bg-red-100 text-red-700'
            )}>
              {test.status}
            </span>
          </div>
        </div>

        {/* Tags */}
        {test.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {test.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
            {test.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{test.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {test.usage.views}
            </span>
            <span className="flex items-center gap-1">
              <Download size={14} />
              {test.usage.downloads}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch size={14} />
              {test.usage.forks}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} />
              {test.usage.stars}
            </span>
          </div>
          <div className="text-xs">
            Quality: {test.quality.overallScore}/100
          </div>
        </div>

        {/* Author and date */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User size={12} />
            {test.author.name}
          </span>
          <span>
            {new Date(test.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTestAction(test, 'star');
            }}
            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
            title="Star test"
          >
            <Star size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTestAction(test, 'fork');
            }}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Fork test"
          >
            <GitBranch size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTestAction(test, 'download');
            }}
            className="p-1 text-gray-400 hover:text-green-500 transition-colors"
            title="Download test"
          >
            <Download size={16} />
          </button>
          <button
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="More actions"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Render test row (list view)
  const renderTestRow = (test: LibraryTest) => {
    const isSelected = selectedTestId === test.id;

    return (
      <tr
        key={test.id}
        onClick={() => handleTestSelect(test)}
        className={clsx(
          'cursor-pointer hover:bg-gray-50 transition-colors',
          isSelected && 'bg-blue-50'
        )}
      >
        <td className="px-4 py-3">
          <div>
            <div className="font-medium text-gray-900">{test.name}</div>
            <div className="text-sm text-gray-600 truncate max-w-xs">
              {test.description || 'No description'}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium capitalize',
            test.status === 'published' && 'bg-green-100 text-green-700',
            test.status === 'review' && 'bg-yellow-100 text-yellow-700',
            test.status === 'draft' && 'bg-gray-100 text-gray-700',
            test.status === 'archived' && 'bg-red-100 text-red-700'
          )}>
            {test.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {test.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {test.author.name}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {test.quality.overallScore}/100
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{test.usage.views} views</span>
            <span>{test.usage.downloads} downloads</span>
            <span>{test.usage.stars} stars</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {new Date(test.updatedAt).toLocaleDateString()}
        </td>
      </tr>
    );
  };

  if (!library) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <Library size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Team Library
          </h3>
          <p className="text-gray-600 mb-4">
            Join a team or create one to access the shared test library.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Create Team
          </button>
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
              Team Library
            </h3>
            <p className="text-sm text-gray-600">
              {filteredTests.length} of {tests.length} tests
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List size={16} />
              </button>
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'updated' | 'popularity' | 'quality')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popularity">Most Popular</option>
              <option value="quality">Highest Quality</option>
              <option value="updated">Recently Updated</option>
              <option value="created">Newest</option>
              <option value="name">Name</option>
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'p-2 rounded-md transition-colors',
                showFilters
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Filter size={16} />
            </button>

            {/* Add test button */}
            <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
              <Plus size={16} className="mr-1" />
              Add Test
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {renderCategoryFilter()}
            {renderTagFilter()}
            {renderStatusFilter()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {filteredTests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tests found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search terms or filters.
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredTests.map(renderTestCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Test
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quality
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTests.map(renderTestRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
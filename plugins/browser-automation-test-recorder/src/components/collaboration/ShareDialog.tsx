/**
 * Share Dialog Component
 * Dialog for sharing test recordings with various options and settings
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  X,
  Share2,
  Globe,
  Users,
  Lock,
  Edit,
  MessageSquare,
  Download,
  GitBranch,
  Tag
} from 'lucide-react';

import type {
  RecordedEvent,
  SharedTestRecording,
  SharingSettings as _SharingSettings
} from '../../types';

export interface ShareDialogProps {
  events: RecordedEvent[];
  onClose: () => void;
  onShare: (sharedTest: SharedTestRecording) => void;
}

/**
 * Share Dialog Component
 */
export const ShareDialog: React.FC<ShareDialogProps> = ({
  events,
  onClose,
  onShare
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: `Test Recording ${new Date().toLocaleDateString()}`,
    description: '',
    visibility: 'private' as 'private' | 'team' | 'public',
    allowFork: true,
    allowEdit: false,
    allowComment: true,
    allowDownload: true,
    password: '',
    expiresAt: '',
    tags: [] as string[],
    category: 'uncategorized'
  });

  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions' | 'advanced'>('basic');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create sharing settings
      const sharing: _SharingSettings = {
        visibility: formData.visibility,
        allowFork: formData.allowFork,
        allowEdit: formData.allowEdit,
        allowComment: formData.allowComment,
        allowDownload: formData.allowDownload,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined,
        password: formData.password || undefined,
        requireLogin: formData.visibility !== 'public',
        permissions: {}
      };

      // Create shared test recording (mock)
      const sharedTest: SharedTestRecording = {
        id: `shared_${Date.now()}`,
        originalId: `original_${Date.now()}`,
        shareId: Math.random().toString(36).substr(2, 16),
        name: formData.name,
        description: formData.description,
        events,
        metadata: {
          sessionId: `session_${Date.now()}`,
          url: window.location.href,
          title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            isLandscape: window.innerWidth > window.innerHeight,
            isMobile: false
          },
          userAgent: navigator.userAgent,
          duration: events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0,
          eventCount: events.length,
          tags: formData.tags,
          category: formData.category,
          framework: 'browser-automation-test-recorder',
          language: 'javascript',
          complexity: events.length > 20 ? 'complex' : events.length > 10 ? 'medium' : 'simple',
          browserSupport: ['chrome', 'firefox', 'safari', 'edge'],
          dependencies: []
        },
        sharing,
        collaborators: [],
        comments: [],
        reviews: [],
        versions: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'current-user'
      };

      onShare(sharedTest);
    } catch (error) {
      console.error('Failed to share test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding tags
  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Render basic settings tab
  const renderBasicTab = () => (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Test Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter test name"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Describe what this test does..."
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Visibility
        </label>
        <div className="grid grid-cols-1 gap-2">
          <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={formData.visibility === 'private'}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'private' | 'team' | 'public' }))}
              className="mr-3"
            />
            <Lock size={16} className="mr-2 text-gray-500" />
            <div>
              <div className="font-medium">Private</div>
              <div className="text-sm text-gray-600">Only you can access this test</div>
            </div>
          </label>

          <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="visibility"
              value="team"
              checked={formData.visibility === 'team'}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'private' | 'team' | 'public' }))}
              className="mr-3"
            />
            <Users size={16} className="mr-2 text-gray-500" />
            <div>
              <div className="font-medium">Team</div>
              <div className="text-sm text-gray-600">All team members can access this test</div>
            </div>
          </label>

          <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={formData.visibility === 'public'}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'private' | 'team' | 'public' }))}
              className="mr-3"
            />
            <Globe size={16} className="mr-2 text-gray-500" />
            <div>
              <div className="font-medium">Public</div>
              <div className="text-sm text-gray-600">Anyone with the link can access this test</div>
            </div>
          </label>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <Tag size={12} className="mr-1" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render permissions tab
  const renderPermissionsTab = () => (
    <div className="space-y-4">
      {/* Allow actions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Allowed Actions</h4>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowFork}
            onChange={(e) => setFormData(prev => ({ ...prev, allowFork: e.target.checked }))}
            className="mr-3"
          />
          <GitBranch size={16} className="mr-2 text-gray-500" />
          <div>
            <div className="font-medium">Allow forking</div>
            <div className="text-sm text-gray-600">Others can create their own copy of this test</div>
          </div>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowEdit}
            onChange={(e) => setFormData(prev => ({ ...prev, allowEdit: e.target.checked }))}
            className="mr-3"
          />
          <Edit size={16} className="mr-2 text-gray-500" />
          <div>
            <div className="font-medium">Allow editing</div>
            <div className="text-sm text-gray-600">Others can modify this test directly</div>
          </div>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowComment}
            onChange={(e) => setFormData(prev => ({ ...prev, allowComment: e.target.checked }))}
            className="mr-3"
          />
          <MessageSquare size={16} className="mr-2 text-gray-500" />
          <div>
            <div className="font-medium">Allow comments</div>
            <div className="text-sm text-gray-600">Others can leave comments on this test</div>
          </div>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowDownload}
            onChange={(e) => setFormData(prev => ({ ...prev, allowDownload: e.target.checked }))}
            className="mr-3"
          />
          <Download size={16} className="mr-2 text-gray-500" />
          <div>
            <div className="font-medium">Allow downloads</div>
            <div className="text-sm text-gray-600">Others can download test files</div>
          </div>
        </label>
      </div>
    </div>
  );

  // Render advanced tab
  const renderAdvancedTab = () => (
    <div className="space-y-4">
      {/* Password protection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password Protection (Optional)
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter password"
        />
        <p className="text-sm text-gray-600 mt-1">
          Require a password to access this test
        </p>
      </div>

      {/* Expiration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expiration Date (Optional)
        </label>
        <input
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-600 mt-1">
          Automatically make this test inaccessible after this date
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="uncategorized">Uncategorized</option>
          <option value="authentication">Authentication</option>
          <option value="navigation">Navigation</option>
          <option value="forms">Forms</option>
          <option value="e2e">End-to-End</option>
          <option value="regression">Regression</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Share2 size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Share Test Recording
              </h2>
              <p className="text-sm text-gray-600">
                Share your test with team members or make it public
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={clsx(
                  'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                Basic Settings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={clsx(
                  'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                Permissions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={clsx(
                  'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'advanced'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                Advanced
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'basic' && renderBasicTab()}
            {activeTab === 'permissions' && renderPermissionsTab()}
            {activeTab === 'advanced' && renderAdvancedTab()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Recording contains {events.length} events
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className={clsx(
                  'px-4 py-2 rounded-md transition-colors',
                  isLoading || !formData.name.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {isLoading ? 'Sharing...' : 'Share Test'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
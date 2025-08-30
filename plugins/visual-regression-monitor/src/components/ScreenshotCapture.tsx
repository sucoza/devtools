import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  Camera, 
  Monitor, 
  Download, 
  Copy, 
  Trash2,
  ExternalLink,
  Grid,
  List,
  Search,
  Filter
} from 'lucide-react';
import { useScreenshots } from '../hooks/useScreenshots';
import { useResponsiveTesting } from '../hooks/useResponsiveTesting';
import { formatTimestamp, formatFileSize, getViewportString } from '../utils';

/**
 * Screenshot capture and management interface
 */
export function ScreenshotCapture() {
  const { screenshots, selectedScreenshot, isCapturing, actions } = useScreenshots();
  const { breakpoints } = useResponsiveTesting();
  
  const [captureUrl, setCaptureUrl] = useState('');
  const [captureSelector, setCaptureSelector] = useState('');
  const [captureName, setCaptureName] = useState('');
  const [selectedViewport, setSelectedViewport] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSingleCapture = async () => {
    if (!captureUrl) return;

    try {
      await actions.captureScreenshot({
        url: captureUrl,
        selector: captureSelector || undefined,
        name: captureName || undefined,
        viewport: selectedViewport ? breakpoints.find(bp => 
          `${bp.width}x${bp.height}` === selectedViewport
        ) : undefined,
      });
      
      // Clear form
      setCaptureUrl('');
      setCaptureSelector('');
      setCaptureName('');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    }
  };

  const handleResponsiveCapture = async () => {
    if (!captureUrl) return;

    try {
      await actions.captureResponsiveScreenshots(captureUrl);
    } catch (error) {
      console.error('Responsive capture failed:', error);
    }
  };

  const filteredScreenshots = actions.filterScreenshots(
    searchQuery || undefined
  );

  const groupedScreenshots = searchQuery 
    ? { 'Search Results': filteredScreenshots }
    : actions.groupScreenshots('url');

  return (
    <div className="flex flex-col h-full">
      {/* Capture Controls */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="url"
                placeholder="Enter URL to capture..."
                value={captureUrl}
                onChange={(e) => setCaptureUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCapturing}
              />
            </div>
            <button
              onClick={handleSingleCapture}
              disabled={!captureUrl || isCapturing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Camera className="w-4 h-4" />
              {isCapturing ? 'Capturing...' : 'Capture'}
            </button>
            <button
              onClick={handleResponsiveCapture}
              disabled={!captureUrl || isCapturing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Monitor className="w-4 h-4" />
              Responsive
            </button>
          </div>

          {/* Advanced Options */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="CSS selector (optional)"
              value={captureSelector}
              onChange={(e) => setCaptureSelector(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isCapturing}
            />
            <input
              type="text"
              placeholder="Screenshot name (optional)"
              value={captureName}
              onChange={(e) => setCaptureName(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isCapturing}
            />
            <select
              value={selectedViewport}
              onChange={(e) => setSelectedViewport(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isCapturing}
            >
              <option value="">Default Viewport</option>
              {breakpoints.map(bp => (
                <option key={`${bp.width}x${bp.height}`} value={`${bp.width}x${bp.height}`}>
                  {bp.name} ({bp.width}×{bp.height})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search screenshots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-1 px-3 py-2 text-sm rounded border transition-colors',
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'px-2 py-2 text-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-2 py-2 text-sm transition-colors border-l border-gray-300 dark:border-gray-600',
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={actions.clearScreenshots}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded border border-red-200 dark:border-red-800 transition-colors"
            disabled={screenshots.length === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Screenshot List/Grid */}
      <div className="flex-1 overflow-auto p-4">
        {screenshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Camera className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No screenshots yet</p>
            <p className="text-sm text-center max-w-md">
              Enter a URL above and click &quot;Capture&quot; to take your first screenshot, 
              or use &quot;Responsive&quot; to capture across multiple breakpoints.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedScreenshots).map(([group, groupScreenshots]) => (
              <div key={group}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  {group}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({groupScreenshots.length})
                  </span>
                </h3>
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {groupScreenshots.map(screenshot => (
                      <ScreenshotCard key={screenshot.id} screenshot={screenshot} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupScreenshots.map(screenshot => (
                      <ScreenshotListItem key={screenshot.id} screenshot={screenshot} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Screenshot Details */}
      {selectedScreenshot && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <ScreenshotDetails screenshot={selectedScreenshot} />
        </div>
      )}
    </div>
  );
}

function ScreenshotCard({ screenshot }: { screenshot: unknown }) {
  const { actions } = useScreenshots();
  
  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => actions.selectScreenshot(screenshot.id)}
    >
      <div className="aspect-video bg-gray-100 dark:bg-gray-700">
        <img 
          src={screenshot.dataUrl} 
          alt={screenshot.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Overlay with actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.downloadScreenshot(screenshot);
          }}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.copyToClipboard(screenshot);
          }}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(screenshot.url, '_blank');
          }}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Open URL"
        >
          <ExternalLink className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
          {screenshot.name}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{getViewportString(screenshot.viewport.width, screenshot.viewport.height)}</span>
          <span>•</span>
          <span>{screenshot.browserEngine}</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatTimestamp(screenshot.timestamp)}
        </div>
      </div>
    </div>
  );
}

function ScreenshotListItem({ screenshot }: { screenshot: unknown }) {
  const { actions } = useScreenshots();
  
  return (
    <div 
      className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => actions.selectScreenshot(screenshot.id)}
    >
      <div className="w-16 h-10 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
        <img 
          src={screenshot.dataUrl} 
          alt={screenshot.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {screenshot.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {screenshot.url}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>{getViewportString(screenshot.viewport.width, screenshot.viewport.height)}</span>
          <span>•</span>
          <span>{screenshot.browserEngine}</span>
          <span>•</span>
          <span>{formatFileSize(screenshot.metadata.fileSize)}</span>
          <span>•</span>
          <span>{formatTimestamp(screenshot.timestamp)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.downloadScreenshot(screenshot);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.copyToClipboard(screenshot);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.removeScreenshot(screenshot.id);
          }}
          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ScreenshotDetails({ screenshot }: { screenshot: unknown }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {screenshot.name}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">URL:</span>
          <p className="text-gray-900 dark:text-white truncate">{screenshot.url}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Viewport:</span>
          <p className="text-gray-900 dark:text-white">
            {getViewportString(screenshot.viewport.width, screenshot.viewport.height)}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Browser:</span>
          <p className="text-gray-900 dark:text-white capitalize">{screenshot.browserEngine}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Size:</span>
          <p className="text-gray-900 dark:text-white">
            {formatFileSize(screenshot.metadata.fileSize)}
          </p>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Captured: {formatTimestamp(screenshot.timestamp)}
        {screenshot.selector && (
          <>
            {' • '}
            Selector: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{screenshot.selector}</code>
          </>
        )}
      </div>
    </div>
  );
}
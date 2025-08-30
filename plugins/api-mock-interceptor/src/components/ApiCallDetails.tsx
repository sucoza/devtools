import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Copy, ExternalLink, Plus, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import type { ApiCall } from '../types';
import { useInterceptor } from '../hooks/useInterceptor';
import { generateId, getTimestamp } from '../utils';

interface ApiCallDetailsProps {
  call: ApiCall;
}

/**
 * Detailed view of an API call
 */
export function ApiCallDetails({ call }: ApiCallDetailsProps) {
  const { actions } = useInterceptor();
  const [activeTab, setActiveTab] = useState<'overview' | 'request' | 'response' | 'headers'>('overview');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error(`Failed to copy ${label}:`, err);
    }
  };

  const formatJson = (obj: unknown) => {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') return obj;
    return JSON.stringify(obj, null, 2);
  };

  const createMockRule = () => {
    const rule = {
      id: generateId(),
      name: `Mock for ${call.request.method} ${call.request.url}`,
      enabled: true,
      priority: 1,
      matcher: {
        url: call.request.url,
        method: call.request.method,
      },
      mockResponse: {
        status: call.response?.status || 200,
        statusText: call.response?.statusText || 'OK',
        headers: call.response?.headers || {},
        body: call.response?.body || { message: 'Mocked response' },
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    actions.addMockRule(rule);
    actions.selectTab('mocks');
    actions.selectRule(rule.id);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-green-600 dark:text-green-400';
    } else if (status >= 300 && status < 400) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else if (status >= 400 && status < 500) {
      return 'text-orange-600 dark:text-orange-400';
    } else if (status >= 500) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {call.request.method}
            </span>
            {call.response && (
              <span className={clsx('text-lg font-semibold', getStatusColor(call.response.status))}>
                {call.response.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {call.error && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Error</span>
              </div>
            )}
            
            {call.isMocked && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Mocked</span>
              </div>
            )}
            
            <button
              onClick={createMockRule}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="Create mock rule from this call"
            >
              <Plus className="w-3 h-3" />
              Mock
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <span className="flex-1">{call.request.url}</span>
          <button
            onClick={() => copyToClipboard(call.request.url, 'URL')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(call.request.url, '_blank')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          Overview
        </button>
        
        <button
          onClick={() => setActiveTab('request')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'request'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          Request
        </button>
        
        <button
          onClick={() => setActiveTab('response')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'response'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          Response
        </button>
        
        <button
          onClick={() => setActiveTab('headers')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'headers'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          Headers
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(call.duration)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timestamp
                </label>
                <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatTimestamp(call.timestamp)}</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {call.error && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Error
                </label>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-400">
                  {call.error}
                </div>
              </div>
            )}

            {/* Mock Info */}
            {call.isMocked && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mock Information
                </label>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded">
                  <div className="text-green-700 dark:text-green-400">
                    This request was mocked
                    {call.mockScenarioId && (
                      <span> by rule: {call.mockScenarioId}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'request' && (
          <div className="space-y-4">
            {call.request.body && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Body
                  </label>
                  <button
                    onClick={() => copyToClipboard(formatJson(call.request.body), 'Request Body')}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Copy request body"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white font-mono overflow-auto max-h-96">
                  {formatJson(call.request.body)}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'response' && (
          <div className="space-y-4">
            {call.response && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <span className={clsx('text-lg font-semibold', getStatusColor(call.response.status))}>
                      {call.response.status} {call.response.statusText}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Response Time
                    </label>
                    <span className="text-gray-900 dark:text-white">
                      {formatTimestamp(call.response.timestamp)}
                    </span>
                  </div>
                </div>

                {call.response.body && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Response Body
                      </label>
                      <button
                        onClick={() => copyToClipboard(formatJson(call.response?.body), 'Response Body')}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Copy response body"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white font-mono overflow-auto max-h-96">
                      {formatJson(call.response?.body)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-6">
            {/* Request Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Request Headers
                </label>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(call.request.headers, null, 2), 'Request Headers')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Copy request headers"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="border border-gray-200 dark:border-gray-600 rounded">
                {Object.entries(call.request.headers || {}).length > 0 ? (
                  Object.entries(call.request.headers).map(([key, value]) => (
                    <div key={key} className="flex border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                      <div className="w-1/3 p-2 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                        {key}
                      </div>
                      <div className="flex-1 p-2 text-sm text-gray-900 dark:text-white font-mono">
                        {value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No request headers
                  </div>
                )}
              </div>
            </div>

            {/* Response Headers */}
            {call.response && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Response Headers
                  </label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(call.response?.headers, null, 2), 'Response Headers')}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Copy response headers"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded">
                  {Object.entries(call.response.headers || {}).length > 0 ? (
                    Object.entries(call.response.headers).map(([key, value]) => (
                      <div key={key} className="flex border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <div className="w-1/3 p-2 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                          {key}
                        </div>
                        <div className="flex-1 p-2 text-sm text-gray-900 dark:text-white font-mono">
                          {value}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No response headers
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiCallDetails;
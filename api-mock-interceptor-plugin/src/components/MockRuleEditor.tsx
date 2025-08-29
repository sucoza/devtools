import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Save, X, Hash, Link, Globe, Clock } from 'lucide-react';
import type { MockRule, HttpMethod, RequestMatcher, MockResponse } from '../types';
import { generateId, getTimestamp } from '../utils';

interface MockRuleEditorProps {
  rule?: MockRule | null;
  onSave: (rule: Partial<MockRule> | MockRule) => void;
  onCancel: () => void;
}

/**
 * Mock Rule Editor component
 */
export function MockRuleEditor({ rule, onSave, onCancel }: MockRuleEditorProps) {
  const [name, setName] = useState(rule?.name || 'New Mock Rule');
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [priority, setPriority] = useState(rule?.priority || 1);
  
  // Matcher state
  const [matcherUrl, setMatcherUrl] = useState(rule?.matcher.url || '');
  const [matcherUrlPattern, setMatcherUrlPattern] = useState(rule?.matcher.urlPattern || '');
  const [matcherMethod, setMatcherMethod] = useState<string>(
    Array.isArray(rule?.matcher.method) 
      ? rule.matcher.method.join(',') 
      : rule?.matcher.method || ''
  );
  const [matcherHeaders, setMatcherHeaders] = useState(
    JSON.stringify(rule?.matcher.headers || {}, null, 2)
  );
  const [matcherBody, setMatcherBody] = useState(
    rule?.matcher.body ? JSON.stringify(rule.matcher.body, null, 2) : ''
  );

  // Response state
  const [responseStatus, setResponseStatus] = useState(rule?.mockResponse.status || 200);
  const [responseStatusText, setResponseStatusText] = useState(rule?.mockResponse.statusText || 'OK');
  const [responseHeaders, setResponseHeaders] = useState(
    JSON.stringify(rule?.mockResponse.headers || { 'content-type': 'application/json' }, null, 2)
  );
  const [responseBody, setResponseBody] = useState(
    rule?.mockResponse.body ? JSON.stringify(rule.mockResponse.body, null, 2) : '{"message": "Mock response"}'
  );
  const [responseDelay, setResponseDelay] = useState(rule?.mockResponse.delay || 0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate JSON fields
    try {
      if (matcherHeaders.trim()) {
        JSON.parse(matcherHeaders);
      }
    } catch {
      newErrors.matcherHeaders = 'Invalid JSON format';
    }

    try {
      if (matcherBody.trim()) {
        JSON.parse(matcherBody);
      }
    } catch {
      newErrors.matcherBody = 'Invalid JSON format';
    }

    try {
      if (responseHeaders.trim()) {
        JSON.parse(responseHeaders);
      }
    } catch {
      newErrors.responseHeaders = 'Invalid JSON format';
    }

    try {
      if (responseBody.trim()) {
        JSON.parse(responseBody);
      }
    } catch {
      newErrors.responseBody = 'Invalid JSON format';
    }

    if (responseStatus < 100 || responseStatus > 599) {
      newErrors.responseStatus = 'Status must be between 100 and 599';
    }

    if (responseDelay < 0) {
      newErrors.responseDelay = 'Delay cannot be negative';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Build matcher
    const matcher: RequestMatcher = {};
    
    if (matcherUrl.trim()) {
      matcher.url = matcherUrl.trim();
    }
    
    if (matcherUrlPattern.trim()) {
      matcher.urlPattern = matcherUrlPattern.trim();
    }
    
    if (matcherMethod.trim()) {
      const methods = matcherMethod.split(',').map(m => m.trim().toUpperCase() as HttpMethod);
      matcher.method = methods.length === 1 ? methods[0] : methods;
    }
    
    if (matcherHeaders.trim()) {
      matcher.headers = JSON.parse(matcherHeaders);
    }
    
    if (matcherBody.trim()) {
      matcher.body = JSON.parse(matcherBody);
    }

    // Build response
    const mockResponse: MockResponse = {
      status: responseStatus,
      statusText: responseStatusText.trim() || undefined,
      headers: responseHeaders.trim() ? JSON.parse(responseHeaders) : undefined,
      body: responseBody.trim() ? JSON.parse(responseBody) : undefined,
      delay: responseDelay > 0 ? responseDelay : undefined,
    };

    const updatedRule: Partial<MockRule> = {
      name: name.trim(),
      enabled,
      priority,
      matcher,
      mockResponse,
      updatedAt: getTimestamp(),
    };

    if (!rule) {
      // Creating new rule
      (updatedRule as MockRule).id = generateId();
      (updatedRule as MockRule).createdAt = getTimestamp();
    }

    onSave(updatedRule);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {rule ? 'Edit Mock Rule' : 'Create Mock Rule'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={validateAndSave}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={clsx(
                  'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                )}
                placeholder="Enter rule name"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable this rule</span>
            </label>
          </div>
        </div>

        {/* Request Matcher */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Request Matcher
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Link className="w-4 h-4 inline mr-1" />
                Exact URL
              </label>
              <input
                type="text"
                value={matcherUrl}
                onChange={(e) => setMatcherUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://api.example.com/users"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                URL Pattern
              </label>
              <input
                type="text"
                value={matcherUrlPattern}
                onChange={(e) => setMatcherUrlPattern(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="*/api/users/* or /api\/users\/\d+/"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              HTTP Methods (comma-separated)
            </label>
            <input
              type="text"
              value={matcherMethod}
              onChange={(e) => setMatcherMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="GET, POST, PUT"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Available: {httpMethods.join(', ')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Headers (JSON)
            </label>
            <textarea
              value={matcherHeaders}
              onChange={(e) => setMatcherHeaders(e.target.value)}
              rows={4}
              className={clsx(
                'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.matcherHeaders ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder='{"authorization": "Bearer *", "content-type": "application/json"}'
            />
            {errors.matcherHeaders && <p className="text-red-600 text-xs mt-1">{errors.matcherHeaders}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Request Body (JSON)
            </label>
            <textarea
              value={matcherBody}
              onChange={(e) => setMatcherBody(e.target.value)}
              rows={4}
              className={clsx(
                'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.matcherBody ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder='{"userId": 123}'
            />
            {errors.matcherBody && <p className="text-red-600 text-xs mt-1">{errors.matcherBody}</p>}
          </div>
        </div>

        {/* Mock Response */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mock Response</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Code *
              </label>
              <input
                type="number"
                value={responseStatus}
                onChange={(e) => setResponseStatus(parseInt(e.target.value) || 200)}
                min="100"
                max="599"
                className={clsx(
                  'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.responseStatus ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {errors.responseStatus && <p className="text-red-600 text-xs mt-1">{errors.responseStatus}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Text
              </label>
              <input
                type="text"
                value={responseStatusText}
                onChange={(e) => setResponseStatusText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="OK"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Delay (ms)
              </label>
              <input
                type="number"
                value={responseDelay}
                onChange={(e) => setResponseDelay(parseInt(e.target.value) || 0)}
                min="0"
                className={clsx(
                  'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.responseDelay ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {errors.responseDelay && <p className="text-red-600 text-xs mt-1">{errors.responseDelay}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Response Headers (JSON)
            </label>
            <textarea
              value={responseHeaders}
              onChange={(e) => setResponseHeaders(e.target.value)}
              rows={4}
              className={clsx(
                'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.responseHeaders ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder='{"content-type": "application/json", "x-custom-header": "value"}'
            />
            {errors.responseHeaders && <p className="text-red-600 text-xs mt-1">{errors.responseHeaders}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Response Body (JSON)
            </label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              rows={8}
              className={clsx(
                'w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.responseBody ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder='{"id": 123, "name": "John Doe", "email": "john@example.com"}'
            />
            {errors.responseBody && <p className="text-red-600 text-xs mt-1">{errors.responseBody}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports template variables: {'{{'} timestamp {'}}'}, {'{{'} iso_date {'}}'}, {'{{'} random_id {'}}'}, {'{{'} random_uuid {'}}'}, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockRuleEditor;
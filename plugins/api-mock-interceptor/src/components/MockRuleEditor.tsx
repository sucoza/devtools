import React, { useState } from 'react';
import { Save, X, Hash, Link, Globe, Clock } from 'lucide-react';
import { COLORS, TYPOGRAPHY, SPACING, COMPONENT_STYLES, mergeStyles } from '@sucoza/shared-components';
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
    <div style={COMPONENT_STYLES.container.base}>
      {/* Header */}
      <div style={COMPONENT_STYLES.header.base}>
        <h2 style={COMPONENT_STYLES.header.title}>
          {rule ? 'Edit Mock Rule' : 'Create Mock Rule'}
        </h2>
        <div style={COMPONENT_STYLES.header.controls}>
          <button
            onClick={validateAndSave}
            style={mergeStyles(COMPONENT_STYLES.button.base, COMPONENT_STYLES.button.primary)}
          >
            <Save style={{ width: '16px', height: '16px' }} />
            Save
          </button>
          <button
            onClick={onCancel}
            style={COMPONENT_STYLES.button.base}
          >
            <X style={{ width: '16px', height: '16px' }} />
            Cancel
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={COMPONENT_STYLES.content.scrollable}>
        {/* Basic Settings */}
        <div style={{ marginBottom: SPACING['6xl'] }}>
          <h3 style={mergeStyles(COMPONENT_STYLES.header.title, { marginBottom: SPACING['2xl'] })}>Basic Settings</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: SPACING['2xl'] }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                Rule Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={mergeStyles(
                  COMPONENT_STYLES.input.base,
                  errors.name ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
                )}
                placeholder="Enter rule name"
              />
              {errors.name && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.name}</p>}
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                Priority
              </label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                style={COMPONENT_STYLES.input.base}
              />
            </div>
          </div>
          
          <div style={{ marginTop: SPACING['3xl'] }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: COLORS.border.focus
                }}
              />
              <span style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.secondary }}>Enable this rule</span>
            </label>
          </div>
        </div>

        {/* Request Matcher */}
        <div style={{ marginBottom: SPACING['6xl'] }}>
          <h3 style={mergeStyles(COMPONENT_STYLES.header.title, { 
            marginBottom: SPACING['2xl'], 
            display: 'flex', 
            alignItems: 'center', 
            gap: SPACING.md 
          })}>
            <Hash style={{ width: '20px', height: '20px' }} />
            Request Matcher
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: SPACING['2xl'], marginBottom: SPACING['3xl'] }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                <Link style={{ width: '16px', height: '16px' }} />
                Exact URL
              </label>
              <input
                type="text"
                value={matcherUrl}
                onChange={(e) => setMatcherUrl(e.target.value)}
                style={COMPONENT_STYLES.input.base}
                placeholder="https://api.example.com/users"
              />
            </div>
            
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                <Globe style={{ width: '16px', height: '16px' }} />
                URL Pattern
              </label>
              <input
                type="text"
                value={matcherUrlPattern}
                onChange={(e) => setMatcherUrlPattern(e.target.value)}
                style={COMPONENT_STYLES.input.base}
                placeholder="*/api/users/* or /api\/users\/\d+/"
              />
            </div>
          </div>
          
          <div style={{ marginBottom: SPACING['3xl'] }}>
            <label style={{
              display: 'block',
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              marginBottom: SPACING.xs
            }}>
              HTTP Methods (comma-separated)
            </label>
            <input
              type="text"
              value={matcherMethod}
              onChange={(e) => setMatcherMethod(e.target.value)}
              style={COMPONENT_STYLES.input.base}
              placeholder="GET, POST, PUT"
            />
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.muted,
              marginTop: SPACING.xs
            }}>
              Available: {httpMethods.join(', ')}
            </p>
          </div>
          
          <div style={{ marginBottom: SPACING['3xl'] }}>
            <label style={{
              display: 'block',
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              marginBottom: SPACING.xs
            }}>
              Headers (JSON)
            </label>
            <textarea
              value={matcherHeaders}
              onChange={(e) => setMatcherHeaders(e.target.value)}
              rows={4}
              style={mergeStyles(
                COMPONENT_STYLES.input.base,
                { fontFamily: TYPOGRAPHY.fontFamily.mono },
                errors.matcherHeaders ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
              )}
              placeholder='{"authorization": "Bearer *", "content-type": "application/json"}'
            />
            {errors.matcherHeaders && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.matcherHeaders}</p>}
          </div>
          
          <div style={{ marginBottom: SPACING['3xl'] }}>
            <label style={{
              display: 'block',
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              marginBottom: SPACING.xs
            }}>
              Request Body (JSON)
            </label>
            <textarea
              value={matcherBody}
              onChange={(e) => setMatcherBody(e.target.value)}
              rows={4}
              style={mergeStyles(
                COMPONENT_STYLES.input.base,
                { fontFamily: TYPOGRAPHY.fontFamily.mono },
                errors.matcherBody ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
              )}
              placeholder='{"userId": 123}'
            />
            {errors.matcherBody && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.matcherBody}</p>}
          </div>
        </div>

        {/* Mock Response */}
        <div style={{ marginBottom: SPACING['6xl'] }}>
          <h3 style={mergeStyles(COMPONENT_STYLES.header.title, { marginBottom: SPACING['2xl'] })}>Mock Response</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: SPACING['2xl'], marginBottom: SPACING['3xl'] }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                Status Code *
              </label>
              <input
                type="number"
                value={responseStatus}
                onChange={(e) => setResponseStatus(parseInt(e.target.value) || 200)}
                min="100"
                max="599"
                style={mergeStyles(
                  COMPONENT_STYLES.input.base,
                  errors.responseStatus ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
                )}
              />
              {errors.responseStatus && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.responseStatus}</p>}
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                Status Text
              </label>
              <input
                type="text"
                value={responseStatusText}
                onChange={(e) => setResponseStatusText(e.target.value)}
                style={COMPONENT_STYLES.input.base}
                placeholder="OK"
              />
            </div>
            
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary,
                marginBottom: SPACING.xs
              }}>
                <Clock style={{ width: '16px', height: '16px' }} />
                Delay (ms)
              </label>
              <input
                type="number"
                value={responseDelay}
                onChange={(e) => setResponseDelay(parseInt(e.target.value) || 0)}
                min="0"
                style={mergeStyles(
                  COMPONENT_STYLES.input.base,
                  errors.responseDelay ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
                )}
              />
              {errors.responseDelay && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.responseDelay}</p>}
            </div>
          </div>
          
          <div style={{ marginBottom: SPACING['3xl'] }}>
            <label style={{
              display: 'block',
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              marginBottom: SPACING.xs
            }}>
              Response Headers (JSON)
            </label>
            <textarea
              value={responseHeaders}
              onChange={(e) => setResponseHeaders(e.target.value)}
              rows={4}
              style={mergeStyles(
                COMPONENT_STYLES.input.base,
                { fontFamily: TYPOGRAPHY.fontFamily.mono },
                errors.responseHeaders ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
              )}
              placeholder='{"content-type": "application/json", "x-custom-header": "value"}'
            />
            {errors.responseHeaders && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.responseHeaders}</p>}
          </div>
          
          <div style={{ marginBottom: SPACING['3xl'] }}>
            <label style={{
              display: 'block',
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary,
              marginBottom: SPACING.xs
            }}>
              Response Body (JSON)
            </label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              rows={8}
              style={mergeStyles(
                COMPONENT_STYLES.input.base,
                { fontFamily: TYPOGRAPHY.fontFamily.mono },
                errors.responseBody ? { borderColor: COLORS.status.error, boxShadow: `0 0 0 1px ${COLORS.status.error}` } : {}
              )}
              placeholder='{"id": 123, "name": "John Doe", "email": "john@example.com"}'
            />
            {errors.responseBody && <p style={{ color: COLORS.status.error, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs }}>{errors.responseBody}</p>}
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.muted,
              marginTop: SPACING.xs
            }}>
              Supports template variables: {'{{'} timestamp {'}}'}, {'{{'} iso_date {'}}'}, {'{{'} random_id {'}}'}, {'{{'} random_uuid {'}}'}, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockRuleEditor;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  Eye,
  ChevronDown,
  ChevronRight,
  FileText,
  History,
  Accessibility,
  Send
} from 'lucide-react';
import {
  PluginPanel,
  SearchInput,
  ScrollableContainer,
  DataTable,
  Badge,
  EmptyState,
  StatusIndicator,
  Tabs,
  SplitPane,
  CodeBlock,
  Alert,
  Collapsible,
  ProgressBar
} from '@sucoza/shared-components';
import { formStateEventClient } from './formEventClient';
import type { 
  FormState, 
  FieldState, 
  FieldHistoryEntry as _FieldHistoryEntry, 
  AccessibilityIssue as _AccessibilityIssue,
  FormSubmission,
  ValidationState 
} from './formEventClient';

interface FormStateUIState {
  selectedFormId: string | null;
  selectedFieldName: string | null;
  activeTab: 'fields' | 'validation' | 'history' | 'performance' | 'accessibility' | 'submissions';
  showOnlyDirty: boolean;
  showOnlyInvalid: boolean;
  autoRefresh: boolean;
  searchQuery: string;
  expandedForms: string[];
  expandedFields: string[];
  replaySpeed: number;
}

const FORM_STATE_UI_KEY = 'form-state-devtools-ui-state';

const saveUIState = (state: FormStateUIState) => {
  try {
    localStorage.setItem(FORM_STATE_UI_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
};

const loadUIState = (): Partial<FormStateUIState> => {
  try {
    const saved = localStorage.getItem(FORM_STATE_UI_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const getValidationStateColor = (state: ValidationState): string => {
  switch (state) {
    case 'valid': return '#10b981';
    case 'invalid': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'pending': return '#6b7280';
    default: return '#6b7280';
  }
};

const getFieldStateIndicator = (field: FieldState): string => {
  const indicators = [];
  if (field.isDirty) indicators.push('Dirty');
  if (field.isTouched) indicators.push('Touched');
  if (field.isPristine) indicators.push('Pristine');
  if (!field.isValid) indicators.push('Invalid');
  if (field.isRequired) indicators.push('Required');
  return indicators.join(' • ');
};

export function FormStateDevToolsPanel() {
  const savedState = loadUIState();
  
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [selectedFormId, setSelectedFormId] = useState<string | null>(savedState.selectedFormId || null);
  const [selectedFieldName, _setSelectedFieldName] = useState<string | null>(savedState.selectedFieldName || null);
  const [activeTab, setActiveTab] = useState<FormStateUIState['activeTab']>(savedState.activeTab || 'fields');
  const [showOnlyDirty, setShowOnlyDirty] = useState(savedState.showOnlyDirty ?? false);
  const [showOnlyInvalid, setShowOnlyInvalid] = useState(savedState.showOnlyInvalid ?? false);
  const [autoRefresh, setAutoRefresh] = useState(savedState.autoRefresh ?? true);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '');
  const [expandedForms, setExpandedForms] = useState<string[]>(savedState.expandedForms || []);
  const [expandedFields, setExpandedFields] = useState<string[]>(savedState.expandedFields || []);
  const [replaySpeed, setReplaySpeed] = useState(savedState.replaySpeed || 1);
  const [isReplaying, setIsReplaying] = useState(false);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Save UI state when it changes
  useEffect(() => {
    saveUIState({
      selectedFormId,
      selectedFieldName,
      activeTab,
      showOnlyDirty,
      showOnlyInvalid,
      autoRefresh,
      searchQuery,
      expandedForms,
      expandedFields,
      replaySpeed
    });
  }, [selectedFormId, selectedFieldName, activeTab, showOnlyDirty, showOnlyInvalid, autoRefresh, searchQuery, expandedForms, expandedFields, replaySpeed]);

  // Set up event listeners
  useEffect(() => {
    const handleFormStateUpdate = (event: any) => {
      setForms(event.payload.forms);
    };

    const handleFormSubmit = (event: any) => {
      setSubmissions(prev => [...prev, event.payload.submission]);
    };

    formStateEventClient.on('form-state-update', handleFormStateUpdate);
    formStateEventClient.on('form-state-response', handleFormStateUpdate);
    formStateEventClient.on('form-submit', handleFormSubmit);

    // Request initial state
    formStateEventClient.emit('form-state-request', undefined);

    // Set up auto-refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        formStateEventClient.emit('form-state-request', undefined);
      }, 1000);
    }

    return () => {
      formStateEventClient.off('form-state-update', handleFormStateUpdate);
      formStateEventClient.off('form-state-response', handleFormStateUpdate);
      formStateEventClient.off('form-submit', handleFormSubmit);
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const selectedForm = selectedFormId ? forms[selectedFormId] : null;

  const filteredFields = useMemo(() => {
    if (!selectedForm) return [];
    
    let fields = Object.values(selectedForm.fields);
    
    if (showOnlyDirty) {
      fields = fields.filter(field => field.isDirty);
    }
    
    if (showOnlyInvalid) {
      fields = fields.filter(field => !field.isValid);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      fields = fields.filter(field => 
        field.name.toLowerCase().includes(query) ||
        JSON.stringify(field.value).toLowerCase().includes(query)
      );
    }
    
    return fields;
  }, [selectedForm, showOnlyDirty, showOnlyInvalid, searchQuery]);

  const handleReplayForm = useCallback(async (formId: string) => {
    const form = forms[formId];
    if (!form || !form.fieldHistory.length) return;

    setIsReplaying(true);
    
    formStateEventClient.emit('form-replay-start', {
      formId,
      startTimestamp: Date.now()
    });

    for (const entry of form.fieldHistory) {
      formStateEventClient.emit('form-replay-step', {
        formId,
        historyEntry: entry
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000 / replaySpeed));
    }

    formStateEventClient.emit('form-replay-complete', {
      formId,
      duration: Date.now()
    });

    setIsReplaying(false);
  }, [forms, replaySpeed]);

  const _toggleFormExpanded = (_formId: string) => {
    setExpandedForms(prev => 
      prev.includes(_formId) 
        ? prev.filter(id => id !== _formId)
        : [...prev, _formId]
    );
  };

  const toggleFieldExpanded = (fieldName: string) => {
    setExpandedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(name => name !== fieldName)
        : [...prev, fieldName]
    );
  };

  const tabs = [
    {
      id: 'fields',
      label: 'Fields',
      icon: FileText,
      badge: selectedForm && filteredFields.length > 0 ? { count: filteredFields.length } : undefined,
      content: renderFieldsTab()
    },
    {
      id: 'validation',
      label: 'Validation',
      icon: CheckCircle,
      badge: selectedForm ? { count: Object.values(selectedForm.fields).filter(f => !f.isValid).length, variant: (Object.values(selectedForm.fields).filter(f => !f.isValid).length > 0 ? 'critical' : 'default') as 'critical' | 'serious' | 'moderate' | 'minor' | 'default' } : undefined,
      content: renderValidationTab()
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      badge: selectedForm && selectedForm.fieldHistory.length > 0 ? { count: selectedForm.fieldHistory.length } : undefined,
      content: renderHistoryTab()
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart3,
      content: renderPerformanceTab()
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      icon: Accessibility,
      badge: selectedForm ? { count: selectedForm.accessibilityIssues.length, variant: (selectedForm.accessibilityIssues.length > 0 ? 'moderate' : 'default') as 'critical' | 'serious' | 'moderate' | 'minor' | 'default' } : undefined,
      content: renderAccessibilityTab()
    },
    {
      id: 'submissions',
      label: 'Submissions',
      icon: Send,
      badge: submissions.filter(s => s.formId === selectedFormId).length > 0 ? { count: submissions.filter(s => s.formId === selectedFormId).length } : undefined,
      content: renderSubmissionsTab()
    }
  ];

  const actions = [
    {
      id: 'auto-refresh',
      label: autoRefresh ? 'Disable Auto Refresh' : 'Enable Auto Refresh',
      icon: RefreshCw,
      onClick: () => setAutoRefresh(!autoRefresh),
      variant: autoRefresh ? 'primary' as const : 'default' as const
    }
  ];

  const metrics = [
    { label: 'Forms', value: Object.keys(forms).length },
    { label: 'Active Fields', value: selectedForm ? Object.keys(selectedForm.fields).length : 0 },
    { label: 'Dirty Fields', value: selectedForm ? Object.values(selectedForm.fields).filter(f => f.isDirty).length : 0 },
    { label: 'Invalid Fields', value: selectedForm ? Object.values(selectedForm.fields).filter(f => !f.isValid).length : 0 }
  ];

  function renderFieldsTab() {
    if (!selectedForm) return <EmptyState title="No form selected" description="Select a form to view its fields" />;

    return (
      <ScrollableContainer>
        <div className="space-y-4">
          <div className="text-sm font-medium">Form Fields ({filteredFields.length})</div>
          <div className="space-y-2">
            {filteredFields.map(field => (
              <div key={field.name} className="bg-gray-800 rounded p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{field.name}</span>
                    <Badge variant="default">{field.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator 
                      status={field.isValid ? 'success' : 'error'}
                      label={field.isValid ? 'Valid' : 'Invalid'}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  Value: <code>{JSON.stringify(field.value)}</code>
                </div>
                <div className="flex gap-1">
                  {field.isDirty && <Badge variant="warning">Dirty</Badge>}
                  {field.isTouched && <Badge variant="info">Touched</Badge>}
                  {field.isRequired && <Badge variant="default">Required</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollableContainer>
    );
  }

  function renderValidationTab() {
    if (!selectedForm) return <EmptyState title="No form selected" description="Select a form to view validation status" />;

    const invalidFields = Object.values(selectedForm.fields).filter(f => !f.isValid);

    return (
      <ScrollableContainer>
        <div className="space-y-4">
          {selectedForm.schema && (
            <div className="p-3 bg-blue-900/20 text-blue-400 rounded border border-blue-500/30">
              <div className="text-sm">
                <strong>Schema Type:</strong> {selectedForm.schema.type}
                <br />
                <strong>Fields Defined:</strong> {Object.keys(selectedForm.schema.parsedFields).length}
              </div>
            </div>
          )}

          {invalidFields.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-900/20 text-green-400 rounded border border-green-500/30">
              <CheckCircle className="w-4 h-4" />
              All fields are valid
            </div>
          ) : (
            <div className="space-y-2">
              {invalidFields.map(field => (
                <div key={field.name} className="flex items-start gap-2 p-3 bg-red-900/20 text-red-400 rounded border border-red-500/30">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <strong>{field.name}:</strong> {field.validation.message || 'Validation failed'}
                    {field.validation.rule && (
                      <div className="text-xs opacity-75 mt-1">Rule: {field.validation.rule}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollableContainer>
    );
  }

  function renderHistoryTab() {
    if (!selectedForm) return <EmptyState title="No form selected" description="Select a form to view field history" />;

    return (
      <ScrollableContainer>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Replay Speed: {replaySpeed}x</span>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                className="w-24"
              />
            </div>
            <button
              onClick={() => handleReplayForm(selectedFormId!)}
              disabled={isReplaying || selectedForm.fieldHistory.length === 0}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              {isReplaying ? 'Replaying...' : 'Replay Form'}
            </button>
          </div>

          <div className="space-y-2">
            {selectedForm.fieldHistory.slice().reverse().map((entry, index) => (
              <div key={`${entry.fieldName}-${entry.timestamp}-${index}`} className="bg-gray-800 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{entry.fieldName} • {entry.action}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  <code>{JSON.stringify(entry.value)}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollableContainer>
    );
  }

  function renderPerformanceTab() {
    if (!selectedForm) return <EmptyState title="No form selected" description="Select a form to view performance metrics" />;

    return (
      <ScrollableContainer>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded p-4">
              <div className="text-xs text-gray-400 mb-1">Average Validation Time</div>
              <div className="text-2xl font-bold">{selectedForm.performanceMetrics.averageValidationTime.toFixed(2)}ms</div>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <div className="text-xs text-gray-400 mb-1">Total Renders</div>
              <div className="text-2xl font-bold">{selectedForm.performanceMetrics.totalRenderCount}</div>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <div className="text-xs text-gray-400 mb-1">Last Validation</div>
              <div className="text-2xl font-bold">{selectedForm.performanceMetrics.lastValidationTime.toFixed(2)}ms</div>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <div className="text-xs text-gray-400 mb-1">Form Age</div>
              <div className="text-2xl font-bold">{((Date.now() - selectedForm.performanceMetrics.formInitTime) / 1000).toFixed(0)}s</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Field Render Counts</h3>
            <div className="space-y-2">
              {Object.entries(selectedForm.performanceMetrics.fieldRenderCounts).map(([fieldName, count]) => (
                <div key={fieldName} className="flex justify-between items-center bg-gray-800 rounded px-3 py-2">
                  <span className="text-sm">{fieldName}</span>
                  <Badge variant="default">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollableContainer>
    );
  }

  function renderAccessibilityTab() {
    if (!selectedForm) return <EmptyState title="No form selected" description="Select a form to view accessibility issues" />;

    return (
      <ScrollableContainer>
        <div className="space-y-4">
          {selectedForm.accessibilityIssues.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-900/20 text-green-400 rounded border border-green-500/30">
              <CheckCircle className="w-4 h-4" />
              No accessibility issues detected
            </div>
          ) : (
            selectedForm.accessibilityIssues.map((issue, index) => (
              <div 
                key={`${issue.fieldName}-${issue.rule}-${index}`}
                className={`p-3 rounded border ${
                  issue.severity === 'error' ? 'bg-red-900/20 text-red-400 border-red-500/30' :
                  issue.severity === 'warning' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                  'bg-blue-900/20 text-blue-400 border-blue-500/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <strong>{issue.fieldName}</strong>
                    <Badge variant={issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'default'}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <div className="text-sm">{issue.message}</div>
                  <div className="text-xs opacity-75">
                    <strong>Rule:</strong> {issue.rule}
                  </div>
                  <div className="text-xs text-blue-400">
                    💡 {issue.suggestion}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollableContainer>
    );
  }

  function renderSubmissionsTab() {
    const formSubmissions = submissions.filter(s => s.formId === selectedFormId);

    return (
      <ScrollableContainer>
        <div className="space-y-4">
          {formSubmissions.length === 0 ? (
            <EmptyState title="No submissions" description="No form submissions recorded yet" />
          ) : (
            formSubmissions.slice().reverse().map((submission, index) => (
              <div 
                key={`${submission.timestamp}-${index}`}
                className={`bg-gray-800 rounded p-4 border-l-4 ${submission.success ? 'border-green-500' : 'border-red-500'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(submission.timestamp).toLocaleString()}
                  </span>
                  <Badge variant={submission.success ? 'success' : 'error'}>
                    {submission.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  Duration: {submission.duration}ms
                </div>
                {Object.keys(submission.validationErrors).length > 0 && (
                  <div className="p-2 bg-red-900/20 text-red-400 rounded border border-red-500/30 mb-2">
                    Errors: {Object.keys(submission.validationErrors).join(', ')}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">View Submitted Values</summary>
                  <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-auto">
                    {JSON.stringify(submission.values, null, 2)}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      </ScrollableContainer>
    );
  }

  return (
    <PluginPanel
      title="Form State Inspector"
      icon={FileText}
      subtitle={selectedForm ? `${selectedForm.isDirty ? 'Modified' : 'Clean'} • ${Object.keys(selectedForm.fields).length} fields` : 'No form selected'}
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as any)}
      actions={actions}
      metrics={metrics}
      showSearch={true}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search fields..."
      // Simplified for now - add proper sidebar/filters later
      showMetrics={true}
    />
  );
}
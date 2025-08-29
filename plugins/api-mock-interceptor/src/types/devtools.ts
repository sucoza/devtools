import type { ApiCall, MockRule, MockScenario, ApiCallFilter, ApiStats, NetworkConditions } from './api-interceptor';

// DevTools state
export interface DevToolsState {
  // API calls history
  apiCalls: Record<string, ApiCall>;
  
  // Mock configuration
  mockRules: Record<string, MockRule>;
  mockScenarios: Record<string, MockScenario>;
  activeMockScenario?: string;
  
  // Global settings
  isInterceptionEnabled: boolean;
  isRecording: boolean;
  networkConditions: NetworkConditions;
  
  // UI state
  ui: {
    activeTab: 'calls' | 'mocks' | 'scenarios' | 'settings';
    selectedCallId?: string;
    selectedRuleId?: string;
    selectedScenarioId?: string;
    showFilters: boolean;
    filter: ApiCallFilter;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Statistics
  stats: ApiStats;
}

// DevTools actions
export type DevToolsAction =
  // API call actions
  | { type: 'api/call/add'; payload: ApiCall }
  | { type: 'api/call/update'; payload: { id: string; updates: Partial<ApiCall> } }
  | { type: 'api/call/remove'; payload: string }
  | { type: 'api/calls/clear' }
  
  // Mock rule actions
  | { type: 'mock/rule/add'; payload: MockRule }
  | { type: 'mock/rule/update'; payload: { id: string; updates: Partial<MockRule> } }
  | { type: 'mock/rule/remove'; payload: string }
  | { type: 'mock/rule/toggle'; payload: string }
  | { type: 'mock/rules/clear' }
  
  // Mock scenario actions
  | { type: 'mock/scenario/add'; payload: MockScenario }
  | { type: 'mock/scenario/update'; payload: { id: string; updates: Partial<MockScenario> } }
  | { type: 'mock/scenario/remove'; payload: string }
  | { type: 'mock/scenario/activate'; payload: string }
  | { type: 'mock/scenario/deactivate' }
  | { type: 'mock/scenarios/clear' }
  
  // Control actions
  | { type: 'interception/toggle' }
  | { type: 'recording/toggle' }
  | { type: 'network/conditions/update'; payload: NetworkConditions }
  
  // UI actions
  | { type: 'ui/tab/select'; payload: 'calls' | 'mocks' | 'scenarios' | 'settings' }
  | { type: 'ui/call/select'; payload: string | undefined }
  | { type: 'ui/rule/select'; payload: string | undefined }
  | { type: 'ui/scenario/select'; payload: string | undefined }
  | { type: 'ui/filters/toggle' }
  | { type: 'ui/filter/update'; payload: Partial<ApiCallFilter> }
  | { type: 'ui/theme/set'; payload: 'light' | 'dark' | 'auto' }
  
  // Stats actions
  | { type: 'stats/update'; payload: Partial<ApiStats> }
  | { type: 'stats/reset' };

// Initial state
export const initialDevToolsState: DevToolsState = {
  apiCalls: {},
  mockRules: {},
  mockScenarios: {},
  isInterceptionEnabled: false,
  isRecording: true,
  networkConditions: {},
  ui: {
    activeTab: 'calls',
    showFilters: false,
    filter: {},
    theme: 'auto',
  },
  stats: {
    totalCalls: 0,
    mockedCalls: 0,
    errorCount: 0,
    averageResponseTime: 0,
    methodBreakdown: {} as Record<import('./api-interceptor').HttpMethod, number>,
    statusBreakdown: {},
  },
};
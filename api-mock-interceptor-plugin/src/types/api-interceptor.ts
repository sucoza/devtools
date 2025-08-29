// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Request information
export interface ApiRequest {
  id: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  duration?: number;
}

// Response information
export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
}

// Complete API call record
export interface ApiCall {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  error?: string;
  isMocked: boolean;
  mockScenarioId?: string;
  duration?: number;
  timestamp: number;
}

// Mock configuration
export interface MockRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  matcher: RequestMatcher;
  mockResponse: MockResponse;
  networkConditions?: NetworkConditions;
  createdAt: number;
  updatedAt: number;
}

// Request matching criteria
export interface RequestMatcher {
  url?: string;
  urlPattern?: string; // regex pattern
  method?: HttpMethod | HttpMethod[];
  headers?: Record<string, string>;
  body?: any;
}

// Mock response configuration
export interface MockResponse {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  delay?: number; // milliseconds
}

// Network simulation conditions
export interface NetworkConditions {
  latency?: number; // milliseconds
  throttling?: {
    downloadThroughput: number; // bytes per second
    uploadThroughput: number; // bytes per second
  };
  offline?: boolean;
  failureRate?: number; // 0-1 probability
}

// Mock scenario (collection of rules)
export interface MockScenario {
  id: string;
  name: string;
  description?: string;
  rules: MockRule[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// Filter for API calls history
export interface ApiCallFilter {
  method?: HttpMethod[];
  status?: number[];
  url?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  isMocked?: boolean;
  hasError?: boolean;
}

// Export/import format
export interface ExportData {
  version: string;
  timestamp: number;
  scenarios: MockScenario[];
  rules: MockRule[];
}

// Statistics
export interface ApiStats {
  totalCalls: number;
  mockedCalls: number;
  errorCount: number;
  averageResponseTime: number;
  methodBreakdown: Record<HttpMethod, number>;
  statusBreakdown: Record<number, number>;
}
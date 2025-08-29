// Main exports
export { DesignSystemInspectorPanel } from './components/DesignSystemInspectorPanel';
export { createDesignSystemDevToolsClient, DesignSystemDevToolsClient } from './core/devtools-client';

// Component exports
export * from './components';

// Core exports (specific exports to avoid conflicts)  
export { getDesignSystemAnalyzer } from './core/analyzer';

// Type exports (specific exports to avoid conflicts)  
export type { DesignSystemState, DesignSystemAction, ComponentUsage, DesignToken, ConsistencyIssue } from './types';

// Utility exports
export * from './utils';

// Hook exports
export * from './hooks';

// Default export
export { DesignSystemInspectorPanel as default } from './components/DesignSystemInspectorPanel';
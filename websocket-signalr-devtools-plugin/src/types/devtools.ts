import type { WebSocketConnection, WebSocketMessage, WebSocketMetrics, WebSocketFilter } from './websocket';
import type { SignalRConnection, SignalRMessage, SignalRMetrics, SignalRFilter } from './signalr';

export interface DevToolsState {
  websocket: {
    connections: Map<string, WebSocketConnection>;
    messages: WebSocketMessage[];
    metrics: WebSocketMetrics;
    filter: WebSocketFilter;
    isRecording: boolean;
    maxMessages: number;
  };
  signalr: {
    connections: Map<string, SignalRConnection>;
    messages: SignalRMessage[];
    metrics: SignalRMetrics;
    filter: SignalRFilter;
    isRecording: boolean;
    maxMessages: number;
  };
  ui: {
    selectedTab: 'websocket' | 'signalr' | 'performance';
    selectedConnectionId?: string;
    selectedMessageId?: string;
    showFilters: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  simulation: {
    isActive: boolean;
    connections: SimulatedConnection[];
    messageTemplates: MessageTemplate[];
  };
}

export interface SimulatedConnection {
  id: string;
  type: 'websocket' | 'signalr';
  name: string;
  url: string;
  isConnected: boolean;
  autoReconnect: boolean;
  messageInterval?: number;
  messageTemplate?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'websocket' | 'signalr';
  template: string;
  variables: Record<string, any>;
}

export type DevToolsAction = 
  | { type: 'websocket/connection/add'; payload: WebSocketConnection }
  | { type: 'websocket/connection/update'; payload: { id: string; updates: Partial<WebSocketConnection> } }
  | { type: 'websocket/connection/remove'; payload: string }
  | { type: 'websocket/message/add'; payload: WebSocketMessage }
  | { type: 'websocket/filter/update'; payload: Partial<WebSocketFilter> }
  | { type: 'websocket/recording/toggle' }
  | { type: 'websocket/clear' }
  | { type: 'signalr/connection/add'; payload: SignalRConnection }
  | { type: 'signalr/connection/update'; payload: { id: string; updates: Partial<SignalRConnection> } }
  | { type: 'signalr/connection/remove'; payload: string }
  | { type: 'signalr/message/add'; payload: SignalRMessage }
  | { type: 'signalr/filter/update'; payload: Partial<SignalRFilter> }
  | { type: 'signalr/recording/toggle' }
  | { type: 'signalr/clear' }
  | { type: 'ui/tab/select'; payload: 'websocket' | 'signalr' | 'performance' }
  | { type: 'ui/connection/select'; payload: string | undefined }
  | { type: 'ui/message/select'; payload: string | undefined }
  | { type: 'ui/filters/toggle' }
  | { type: 'ui/theme/set'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'simulation/toggle' }
  | { type: 'simulation/connection/add'; payload: SimulatedConnection }
  | { type: 'simulation/connection/update'; payload: { id: string; updates: Partial<SimulatedConnection> } }
  | { type: 'simulation/connection/remove'; payload: string }
  | { type: 'simulation/template/add'; payload: MessageTemplate }
  | { type: 'simulation/template/update'; payload: { id: string; updates: Partial<MessageTemplate> } }
  | { type: 'simulation/template/remove'; payload: string };

export interface DevToolsConfig {
  maxMessages: number;
  autoConnect: boolean;
  capturePayloads: boolean;
  theme: 'light' | 'dark' | 'auto';
  enableSimulation: boolean;
  performanceMonitoring: boolean;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'har';
  includeMessages: boolean;
  includeConnections: boolean;
  includeMetrics: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
  connectionIds?: string[];
}
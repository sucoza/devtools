import { describe, it, expect } from 'vitest';
import { exportToJSON, exportToCSV, exportToHAR } from '../export-utils';
import type { WebSocketConnection, WebSocketMessage, SignalRConnection, SignalRMessage, ExportOptions } from '../../types';

describe('Export Utils', () => {
  const mockWebSocketConnection: WebSocketConnection = {
    id: 'ws-1',
    url: 'ws://localhost:8080',
    protocols: [],
    state: 'OPEN',
    createdAt: 1234567890000,
    connectedAt: 1234567891000,
    messageCount: { sent: 2, received: 1 },
    bytesTransferred: { sent: 100, received: 50 },
    errors: [],
    lastActivity: 1234567892000,
  };

  const mockWebSocketMessage: WebSocketMessage = {
    id: 'msg-1',
    connectionId: 'ws-1',
    timestamp: 1234567891500,
    type: 'send',
    data: 'Hello World',
    size: 11,
    binary: false,
  };

  const mockSignalRConnection: SignalRConnection = {
    id: 'sr-1',
    hubUrl: 'https://localhost:5001/chathub',
    state: 'Connected',
    createdAt: 1234567890000,
    connectedAt: 1234567891000,
    hubMethods: new Map([
      ['SendMessage', {
        name: 'SendMessage',
        invocationCount: 3,
        averageExecutionTime: 50,
        errorCount: 0,
        lastInvoked: 1234567892000,
      }]
    ]),
    messageCount: { sent: 3, received: 2 },
    bytesTransferred: { sent: 150, received: 100 },
    errors: [],
    reconnectAttempts: 0,
    lastActivity: 1234567892000,
  };

  const mockSignalRMessage: SignalRMessage = {
    id: 'sr-msg-1',
    connectionId: 'sr-1',
    timestamp: 1234567891500,
    direction: 'send',
    type: 'Invocation',
    target: 'SendMessage',
    arguments: ['user1', 'Hello SignalR!'],
    size: 35,
  };

  const defaultOptions: ExportOptions = {
    format: 'json',
    includeMessages: true,
    includeConnections: true,
    includeMetrics: false,
  };

  describe('exportToJSON', () => {
    it('should export WebSocket and SignalR data as JSON', () => {
      const result = exportToJSON(
        [mockWebSocketConnection],
        [mockWebSocketMessage],
        [mockSignalRConnection],
        [mockSignalRMessage],
        defaultOptions
      );

      const data = JSON.parse(result);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.format).toBe('json');
      expect(data.websocket).toBeDefined();
      expect(data.websocket.connections).toHaveLength(1);
      expect(data.websocket.messages).toHaveLength(1);
      expect(data.signalr).toBeDefined();
      expect(data.signalr.connections).toHaveLength(1);
      expect(data.signalr.messages).toHaveLength(1);
    });

    it('should filter by connection IDs', () => {
      const options: ExportOptions = {
        ...defaultOptions,
        connectionIds: ['ws-1'],
      };

      const result = exportToJSON(
        [mockWebSocketConnection],
        [mockWebSocketMessage],
        [mockSignalRConnection],
        [mockSignalRMessage],
        options
      );

      const data = JSON.parse(result);
      expect(data.websocket.connections).toHaveLength(1);
      expect(data.websocket.messages).toHaveLength(1);
      expect(data.signalr.connections).toHaveLength(0); // Filtered out
      expect(data.signalr.messages).toHaveLength(0); // Filtered out
    });

    it('should filter by time range', () => {
      const options: ExportOptions = {
        ...defaultOptions,
        timeRange: {
          start: 1234567890000,
          end: 1234567891000,
        },
      };

      const result = exportToJSON(
        [mockWebSocketConnection],
        [mockWebSocketMessage],
        [mockSignalRConnection],
        [mockSignalRMessage],
        options
      );

      const data = JSON.parse(result);
      // Messages should be filtered out (timestamp: 1234567891500 > end: 1234567891000)
      expect(data.websocket.messages).toHaveLength(0);
      expect(data.signalr.messages).toHaveLength(0);
    });
  });

  describe('exportToCSV', () => {
    it('should export connections as CSV', () => {
      const options: ExportOptions = {
        ...defaultOptions,
        includeMessages: false,
      };

      const result = exportToCSV(
        [mockWebSocketConnection],
        [],
        [mockSignalRConnection],
        [],
        options
      );

      const lines = result.split('\n');
      expect(lines[0]).toContain('Type,ID,URL,State'); // Header
      expect(lines[1]).toContain('WebSocket,ws-1'); // WebSocket data
      expect(lines[2]).toContain('SignalR,sr-1'); // SignalR data
    });

    it('should export messages as CSV', () => {
      const options: ExportOptions = {
        ...defaultOptions,
        includeConnections: false,
      };

      const result = exportToCSV(
        [],
        [mockWebSocketMessage],
        [],
        [mockSignalRMessage],
        options
      );

      const lines = result.split('\n');
      expect(lines[0]).toContain('Type,MessageID,ConnectionID'); // Header
      expect(lines[1]).toContain('WebSocket,msg-1,ws-1'); // WebSocket message
      expect(lines[2]).toContain('SignalR,sr-msg-1,sr-1'); // SignalR message
    });
  });

  describe('exportToHAR', () => {
    it('should export as HAR format', () => {
      const result = exportToHAR(
        [mockWebSocketConnection],
        [mockWebSocketMessage],
        [mockSignalRConnection],
        [mockSignalRMessage],
        defaultOptions
      );

      const har = JSON.parse(result);
      expect(har.log).toBeDefined();
      expect(har.log.version).toBe('1.2');
      expect(har.log.creator.name).toBe('WebSocket SignalR DevTools');
      expect(har.log.entries).toHaveLength(2); // One for WebSocket, one for SignalR

      // Check WebSocket entry
      const wsEntry = har.log.entries.find((entry: any) => entry._webSocket);
      expect(wsEntry).toBeDefined();
      expect(wsEntry.request.url).toBe('ws://localhost:8080');
      expect(wsEntry._webSocket.messages).toHaveLength(1);

      // Check SignalR entry
      const srEntry = har.log.entries.find((entry: any) => entry._signalR);
      expect(srEntry).toBeDefined();
      expect(srEntry.request.url).toBe('https://localhost:5001/chathub');
      expect(srEntry._signalR.messages).toHaveLength(1);
    });
  });
});
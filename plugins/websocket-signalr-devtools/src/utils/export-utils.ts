import type { 
  WebSocketConnection, 
  WebSocketMessage, 
  SignalRConnection, 
  SignalRMessage,
  ExportOptions 
} from '../types';

export interface ExportData {
  metadata: {
    exportedAt: string;
    version: string;
    format: string;
  };
  websocket?: {
    connections: WebSocketConnection[];
    messages: WebSocketMessage[];
  };
  signalr?: {
    connections: SignalRConnection[];
    messages: SignalRMessage[];
  };
}

export function exportToJSON(
  websocketConnections: WebSocketConnection[],
  websocketMessages: WebSocketMessage[],
  signalrConnections: SignalRConnection[],
  signalrMessages: SignalRMessage[],
  options: ExportOptions
): string {
  const data: ExportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      format: 'json',
    },
  };

  // Filter by connection IDs if specified
  let filteredWSConnections = websocketConnections;
  let filteredWSMessages = websocketMessages;
  let filteredSRConnections = signalrConnections;
  let filteredSRMessages = signalrMessages;

  if (options.connectionIds?.length) {
    filteredWSConnections = websocketConnections.filter(conn => 
      options.connectionIds!.includes(conn.id)
    );
    filteredWSMessages = websocketMessages.filter(msg => 
      options.connectionIds!.includes(msg.connectionId)
    );
    filteredSRConnections = signalrConnections.filter(conn => 
      options.connectionIds!.includes(conn.id)
    );
    filteredSRMessages = signalrMessages.filter(msg => 
      options.connectionIds!.includes(msg.connectionId)
    );
  }

  // Filter by time range if specified
  if (options.timeRange) {
    const { start, end } = options.timeRange;
    
    filteredWSConnections = filteredWSConnections.filter(conn => 
      conn.createdAt >= start && conn.createdAt <= end
    );
    filteredWSMessages = filteredWSMessages.filter(msg => 
      msg.timestamp >= start && msg.timestamp <= end
    );
    filteredSRConnections = filteredSRConnections.filter(conn => 
      conn.createdAt >= start && conn.createdAt <= end
    );
    filteredSRMessages = filteredSRMessages.filter(msg => 
      msg.timestamp >= start && msg.timestamp <= end
    );
  }

  // Add data based on options
  if (options.includeConnections) {
    data.websocket = { connections: filteredWSConnections, messages: [] };
    data.signalr = { connections: filteredSRConnections, messages: [] };
  }

  if (options.includeMessages) {
    if (!data.websocket) {
      data.websocket = { connections: [], messages: filteredWSMessages };
    } else {
      data.websocket.messages = filteredWSMessages;
    }
    
    if (!data.signalr) {
      data.signalr = { connections: [], messages: filteredSRMessages };
    } else {
      data.signalr.messages = filteredSRMessages;
    }
  }

  return JSON.stringify(data, null, 2);
}

export function exportToCSV(
  websocketConnections: WebSocketConnection[],
  websocketMessages: WebSocketMessage[],
  signalrConnections: SignalRConnection[],
  signalrMessages: SignalRMessage[],
  options: ExportOptions
): string {
  const lines: string[] = [];

  if (options.includeConnections) {
    // WebSocket connections
    lines.push('Type,ID,URL,State,Created,Connected,Closed,MessagesSent,MessagesReceived,BytesSent,BytesReceived,Errors');
    
    websocketConnections.forEach(conn => {
      if (options.connectionIds?.length && !options.connectionIds.includes(conn.id)) return;
      if (options.timeRange && (conn.createdAt < options.timeRange.start || conn.createdAt > options.timeRange.end)) return;
      
      lines.push([
        'WebSocket',
        conn.id,
        `"${conn.url}"`,
        conn.state,
        new Date(conn.createdAt).toISOString(),
        conn.connectedAt ? new Date(conn.connectedAt).toISOString() : '',
        conn.closedAt ? new Date(conn.closedAt).toISOString() : '',
        conn.messageCount.sent,
        conn.messageCount.received,
        conn.bytesTransferred.sent,
        conn.bytesTransferred.received,
        conn.errors.length,
      ].join(','));
    });

    // SignalR connections
    signalrConnections.forEach(conn => {
      if (options.connectionIds?.length && !options.connectionIds.includes(conn.id)) return;
      if (options.timeRange && (conn.createdAt < options.timeRange.start || conn.createdAt > options.timeRange.end)) return;
      
      lines.push([
        'SignalR',
        conn.id,
        `"${conn.hubUrl}"`,
        conn.state,
        new Date(conn.createdAt).toISOString(),
        conn.connectedAt ? new Date(conn.connectedAt).toISOString() : '',
        conn.disconnectedAt ? new Date(conn.disconnectedAt).toISOString() : '',
        conn.messageCount.sent,
        conn.messageCount.received,
        conn.bytesTransferred.sent,
        conn.bytesTransferred.received,
        conn.errors.length,
      ].join(','));
    });
  }

  if (options.includeMessages) {
    lines.push(''); // Empty line separator
    lines.push('Type,MessageID,ConnectionID,Timestamp,MessageType,Direction,Target,Size,Data');
    
    // WebSocket messages
    websocketMessages.forEach(msg => {
      if (options.connectionIds?.length && !options.connectionIds.includes(msg.connectionId)) return;
      if (options.timeRange && (msg.timestamp < options.timeRange.start || msg.timestamp > options.timeRange.end)) return;
      
      const dataStr = typeof msg.data === 'string' 
        ? msg.data.replace(/"/g, '""') 
        : JSON.stringify(msg.data).replace(/"/g, '""');
      
      lines.push([
        'WebSocket',
        msg.id,
        msg.connectionId,
        new Date(msg.timestamp).toISOString(),
        msg.type,
        '', // No direction for WebSocket
        '', // No target for WebSocket
        msg.size,
        `"${dataStr}"`,
      ].join(','));
    });

    // SignalR messages
    signalrMessages.forEach(msg => {
      if (options.connectionIds?.length && !options.connectionIds.includes(msg.connectionId)) return;
      if (options.timeRange && (msg.timestamp < options.timeRange.start || msg.timestamp > options.timeRange.end)) return;
      
      const argsStr = msg.arguments 
        ? JSON.stringify(msg.arguments).replace(/"/g, '""')
        : msg.result
          ? JSON.stringify(msg.result).replace(/"/g, '""')
          : '';
      
      lines.push([
        'SignalR',
        msg.id,
        msg.connectionId,
        new Date(msg.timestamp).toISOString(),
        msg.type,
        msg.direction,
        msg.target || '',
        msg.size,
        `"${argsStr}"`,
      ].join(','));
    });
  }

  return lines.join('\n');
}

export function exportToHAR(
  websocketConnections: WebSocketConnection[],
  websocketMessages: WebSocketMessage[],
  signalrConnections: SignalRConnection[],
  signalrMessages: SignalRMessage[],
  options: ExportOptions
): string {
  // HAR (HTTP Archive) format for WebSocket/SignalR data
  const har = {
    log: {
      version: '1.2',
      creator: {
        name: 'WebSocket SignalR DevTools',
        version: '1.0.0',
      },
      entries: [] as any[],
    },
  };

  // Convert WebSocket connections to HAR entries
  websocketConnections.forEach(conn => {
    if (options.connectionIds?.length && !options.connectionIds.includes(conn.id)) return;
    if (options.timeRange && (conn.createdAt < options.timeRange.start || conn.createdAt > options.timeRange.end)) return;
    
    har.log.entries.push({
      startedDateTime: new Date(conn.createdAt).toISOString(),
      time: conn.closedAt ? conn.closedAt - conn.createdAt : Date.now() - conn.createdAt,
      request: {
        method: 'GET',
        url: conn.url,
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'Connection', value: 'Upgrade' },
          { name: 'Upgrade', value: 'websocket' },
        ],
        cookies: [],
        queryString: [],
        headersSize: -1,
        bodySize: 0,
      },
      response: {
        status: conn.state === 'OPEN' ? 101 : conn.state === 'CLOSED' ? 200 : 0,
        statusText: conn.state === 'OPEN' ? 'Switching Protocols' : conn.state,
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'Connection', value: 'Upgrade' },
          { name: 'Upgrade', value: 'websocket' },
        ],
        cookies: [],
        content: {
          size: conn.bytesTransferred.sent + conn.bytesTransferred.received,
          mimeType: 'application/json',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: conn.bytesTransferred.received,
      },
      cache: {},
      timings: {
        send: 0,
        wait: conn.connectedAt ? conn.connectedAt - conn.createdAt : 0,
        receive: 0,
      },
      _webSocket: {
        messages: websocketMessages
          .filter(msg => msg.connectionId === conn.id)
          .map(msg => ({
            type: msg.type,
            time: msg.timestamp,
            opcode: msg.binary ? 2 : 1,
            data: msg.data,
          })),
      },
    });
  });

  // Convert SignalR connections to HAR entries
  signalrConnections.forEach(conn => {
    if (options.connectionIds?.length && !options.connectionIds.includes(conn.id)) return;
    if (options.timeRange && (conn.createdAt < options.timeRange.start || conn.createdAt > options.timeRange.end)) return;
    
    har.log.entries.push({
      startedDateTime: new Date(conn.createdAt).toISOString(),
      time: conn.disconnectedAt ? conn.disconnectedAt - conn.createdAt : Date.now() - conn.createdAt,
      request: {
        method: 'POST',
        url: conn.hubUrl,
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'Content-Type', value: 'application/json' },
        ],
        cookies: [],
        queryString: [],
        headersSize: -1,
        bodySize: 0,
      },
      response: {
        status: conn.state === 'Connected' ? 200 : 0,
        statusText: conn.state,
        httpVersion: 'HTTP/1.1',
        headers: [
          { name: 'Content-Type', value: 'application/json' },
        ],
        cookies: [],
        content: {
          size: conn.bytesTransferred.sent + conn.bytesTransferred.received,
          mimeType: 'application/json',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: conn.bytesTransferred.received,
      },
      cache: {},
      timings: {
        send: 0,
        wait: conn.connectedAt ? conn.connectedAt - conn.createdAt : 0,
        receive: 0,
      },
      _signalR: {
        transport: conn.transport,
        messages: signalrMessages
          .filter(msg => msg.connectionId === conn.id)
          .map(msg => ({
            type: msg.type,
            direction: msg.direction,
            time: msg.timestamp,
            target: msg.target,
            arguments: msg.arguments,
            result: msg.result,
          })),
      },
    });
  });

  return JSON.stringify(har, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
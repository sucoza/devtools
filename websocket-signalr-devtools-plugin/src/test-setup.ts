import '@testing-library/jest-dom';

// Mock ResizeObserver which is needed for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: async (text: string) => {},
    readText: async () => '',
  },
});

// Mock WebSocket for tests
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocols: string | string[];
  
  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols || [];
    
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send(data: any) {
    // Mock implementation
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
      }
    }, 10);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    // Mock implementation
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    // Mock implementation
  }
}

(global as any).WebSocket = MockWebSocket;
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Canvas and ImageData APIs
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  drawImage: vi.fn(),
  fillStyle: '',
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  canvas: {
    width: 1920,
    height: 1080,
    toDataURL: vi.fn(() => 'data:image/png;base64,mock')
  }
}));

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

// Mock Image constructor
global.Image = class Image {
  width = 0;
  height = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    setTimeout(() => {
      this.width = 1920;
      this.height = 1080;
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
};

// Mock Web Workers
global.Worker = class Worker extends EventTarget {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    super();
    this.url = url;
  }

  postMessage(data: any) {
    // Mock worker responses
    setTimeout(() => {
      if (this.onmessage) {
        if (data.type === 'calculateSSIM') {
          this.onmessage(new MessageEvent('message', {
            data: { type: 'ssimResult', data: 0.95 }
          }));
        } else if (data.type === 'processChunk') {
          this.onmessage(new MessageEvent('message', {
            data: { type: 'chunkResult', data: [] }
          }));
        }
      }
    }, 0);
  }

  terminate() {
    // Mock terminate
  }
};

// Mock OffscreenCanvas
global.OffscreenCanvas = class OffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext() {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(this.width * this.height * 4),
        width: this.width,
        height: this.height
      })),
      putImageData: vi.fn(),
      drawImage: vi.fn()
    };
  }
};

// Mock MCP Playwright tools
global.mcpPlaywrightTools = {
  browser_navigate: vi.fn().mockResolvedValue({}),
  browser_resize: vi.fn().mockResolvedValue({}),
  browser_take_screenshot: vi.fn().mockResolvedValue({
    filename: 'mock-screenshot.png',
    data: 'data:image/png;base64,mock'
  }),
  browser_snapshot: vi.fn().mockResolvedValue({
    elements: []
  }),
  browser_evaluate: vi.fn().mockResolvedValue({}),
  browser_wait_for: vi.fn().mockResolvedValue({}),
  browser_click: vi.fn().mockResolvedValue({}),
  browser_hover: vi.fn().mockResolvedValue({}),
  browser_close: vi.fn().mockResolvedValue({}),
  browser_install: vi.fn().mockResolvedValue({})
};

// Mock performance.now for consistent timing
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock crypto for hash generation
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock URL constructor
global.URL = class URL {
  href: string;
  protocol: string;
  hostname: string;
  pathname: string;

  constructor(url: string) {
    this.href = url;
    this.protocol = 'https:';
    this.hostname = 'example.com';
    this.pathname = '/';
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
};
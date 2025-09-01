import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Fix for React 19 and @testing-library/react compatibility
// React 19 requires globalThis.IS_REACT_ACT_ENVIRONMENT to be set
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock ImageData constructor
global.ImageData = class ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = 'srgb';

  constructor(sw: number, sh: number);
  constructor(data: Uint8ClampedArray, sw: number, sh?: number);
  constructor(dataOrWidth: Uint8ClampedArray | number, swOrHeight: number, sh?: number) {
    if (typeof dataOrWidth === 'number') {
      // constructor(sw: number, sh: number)
      this.width = dataOrWidth;
      this.height = swOrHeight;
      this.data = new Uint8ClampedArray(dataOrWidth * swOrHeight * 4);
    } else {
      // constructor(data: Uint8ClampedArray, sw: number, sh?: number)
      this.data = dataOrWidth;
      this.width = swOrHeight;
      this.height = sh || (dataOrWidth.length / 4 / swOrHeight);
    }
  }
} as unknown as typeof ImageData;

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
  },
  // Add missing CanvasRenderingContext2D properties
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  beginPath: vi.fn(),
  clip: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  arcTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  ellipse: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  getTransform: vi.fn(),
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  lineDashOffset: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: '',
  filter: 'none',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',
  strokeRect: vi.fn(),
  strokeText: vi.fn(),
  textAlign: 'start',
  textBaseline: 'alphabetic',
  direction: 'inherit',
  font: '10px sans-serif',
  fontKerning: 'auto',
  fontStretch: 'normal',
  fontVariantCaps: 'normal',
  getLineDash: vi.fn(() => []),
  setLineDash: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createConicGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  })),
  createPattern: vi.fn(),
  isContextLost: vi.fn(() => false),
  getContextAttributes: vi.fn()
})) as unknown as CanvasRenderingContext2D;

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

// Mock Image constructor
global.Image = class Image extends EventTarget {
  width = 0;
  height = 0;
  naturalWidth = 0;
  naturalHeight = 0;
  complete = false;
  src = '';
  alt = '';
  crossOrigin: string | null = null;
  decoding = 'auto';
  isMap = false;
  loading = 'eager';
  referrerPolicy = '';
  sizes = '';
  srcset = '';
  useMap = '';
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onabort: ((event: UIEvent) => void) | null = null;
  
  // Add missing HTMLElement properties with minimal implementation
  accessKey = '';
  className = '';
  id = '';
  lang = '';
  title = '';
  dir = '';
  hidden = false;
  innerHTML = '';
  innerText = '';
  outerHTML = '';
  outerText = '';
  tagName = 'IMG';
  nodeName = 'IMG';
  nodeType = 1;
  nodeValue: string | null = null;
  textContent: string | null = null;
  parentElement: Element | null = null;
  parentNode: ParentNode | null = null;
  childNodes = [] as unknown as NodeList;
  children = [] as unknown as HTMLCollection;
  firstChild: ChildNode | null = null;
  lastChild: ChildNode | null = null;
  nextSibling: ChildNode | null = null;
  previousSibling: ChildNode | null = null;

  constructor() {
    super();
    setTimeout(() => {
      this.width = 1920;
      this.height = 1080;
      this.naturalWidth = 1920;
      this.naturalHeight = 1080;
      this.complete = true;
      if (this.onload) {
        this.onload(new Event('load'));
      }
    }, 0);
  }

  // Add missing methods with minimal implementation
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  getAttribute = vi.fn();
  setAttribute = vi.fn();
  removeAttribute = vi.fn();
  hasAttribute = vi.fn();
  appendChild = vi.fn();
  removeChild = vi.fn();
  insertBefore = vi.fn();
  cloneNode = vi.fn();
  click = vi.fn();
  blur = vi.fn();
  focus = vi.fn();
} as unknown as HTMLElement;

// Mock Web Workers
global.Worker = class Worker extends EventTarget {
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  constructor(url: string, _options?: WorkerOptions) {
    super();
    this.url = url;
  }

  postMessage(data: unknown, _transfer?: Transferable[]) {
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

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
} as unknown as Worker;

// Mock OffscreenCanvas
global.OffscreenCanvas = class OffscreenCanvas extends EventTarget {
  width: number;
  height: number;
  oncontextlost: ((event: Event) => void) | null = null;
  oncontextrestored: ((event: Event) => void) | null = null;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  getContext(_contextType: unknown, _options?: unknown) {
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

  convertToBlob(_options?: ImageEncodeOptions): Promise<Blob> {
    return Promise.resolve(new Blob(['mock-blob'], { type: 'image/png' }));
  }

  transferToImageBitmap(): ImageBitmap {
    return {} as ImageBitmap;
  }

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
} as unknown as OffscreenCanvas;

// Mock MCP Playwright tools
const mockMCPPlaywrightTools = {
  browser_navigate: vi.fn().mockResolvedValue({}),
  browser_resize: vi.fn().mockResolvedValue({}),
  browser_take_screenshot: vi.fn().mockResolvedValue({
    filename: 'mock-screenshot.png',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
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

// Set up global references for different environments
global.mcpPlaywrightTools = mockMCPPlaywrightTools;
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).mcpPlaywrightTools = mockMCPPlaywrightTools;
}

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
    getRandomValues: vi.fn((arr: unknown[]) => {
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
  search: string;
  searchParams: URLSearchParams;
  hash: string;
  host: string;
  origin: string;
  port: string;
  username: string;
  password: string;

  constructor(url: string, _base?: string | URL) {
    this.href = url;
    this.protocol = 'https:';
    this.hostname = 'example.com';
    this.pathname = '/';
    this.search = '';
    this.hash = '';
    this.host = 'example.com';
    this.origin = 'https://example.com';
    this.port = '';
    this.username = '';
    this.password = '';
    this.searchParams = new URLSearchParams();
  }

  toString() {
    return this.href;
  }

  toJSON() {
    return this.href;
  }

  static canParse(_url: string | URL, _base?: string | URL): boolean {
    return true;
  }

  static createObjectURL(_obj: Blob | MediaSource): string {
    return 'blob:mock-object-url';
  }

  static parse(url: string | URL, _base?: string | URL): URL | null {
    try {
      return new URL(url as string);
    } catch {
      return null;
    }
  }

  static revokeObjectURL(_url: string): void {
    // Mock implementation
  }
} as unknown as typeof URL;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: readonly number[] = [0];

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    // Mock implementation
  }

  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
};
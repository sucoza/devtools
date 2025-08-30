/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format file size in bytes to readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const copy = {} as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return copy as T;
  }
  
  return obj;
}

/**
 * Calculate image hash for comparison
 */
export function calculateImageHash(imageData: Uint8Array): string {
  let hash = 0;
  for (let i = 0; i < imageData.length; i += 4) {
    // Simple hash based on RGBA values
    hash = ((hash << 5) - hash + imageData[i] + imageData[i + 1] + imageData[i + 2]) >>> 0;
  }
  return hash.toString(16);
}

/**
 * Convert data URL to blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert blob to data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get viewport string representation
 */
export function getViewportString(width: number, height: number, deviceScaleFactor: number = 1): string {
  return `${width}x${height}@${deviceScaleFactor}x`;
}

/**
 * Parse viewport string back to dimensions
 */
export function parseViewportString(viewportString: string): { width: number; height: number; deviceScaleFactor: number } {
  const match = viewportString.match(/(\d+)x(\d+)(?:@(\d+(?:\.\d+)?)x)?/);
  if (!match) {
    throw new Error(`Invalid viewport string: ${viewportString}`);
  }
  
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
    deviceScaleFactor: match[3] ? parseFloat(match[3]) : 1,
  };
}

/**
 * Compress string using LZ77-like algorithm (simplified)
 */
export function compressString(str: string): string {
  return str; // Placeholder - could implement actual compression
}

/**
 * Decompress string
 */
export function decompressString(compressed: string): string {
  return compressed; // Placeholder - could implement actual decompression
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Compare two numbers with tolerance
 */
export function isWithinTolerance(value1: number, value2: number, tolerance: number): boolean {
  return Math.abs(value1 - value2) <= tolerance;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate color difference (Delta E)
 */
export function calculateColorDifference(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  // Simplified Delta E calculation
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Get responsive breakpoint name from viewport
 */
export function getBreakpointName(width: number): string {
  if (width <= 480) return 'Mobile Small';
  if (width <= 768) return 'Mobile Large';
  if (width <= 1024) return 'Tablet';
  if (width <= 1440) return 'Desktop';
  return 'Large Desktop';
}

/**
 * Generate CSS selector for element
 */
export function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = Array.from(element.classList)
      .filter(cls => cls && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(cls))
      .slice(0, 3);
    
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }
  }
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (!parent) {
    return tagName;
  }
  
  const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
  if (siblings.length === 1) {
    return `${generateSelector(parent)} > ${tagName}`;
  }
  
  const index = siblings.indexOf(element) + 1;
  return `${generateSelector(parent)} > ${tagName}:nth-child(${index})`;
}

/**
 * Wait for specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayTime = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayTime);
    }
  }
  
  throw lastError || new Error('Retry failed');
}
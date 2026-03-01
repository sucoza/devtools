/**
 * Generate a unique identifier
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-100 border-red-200';
    case 'high':
      return 'text-orange-700 bg-orange-100 border-orange-200';
    case 'medium':
      return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    case 'low':
      return 'text-green-700 bg-green-100 border-green-200';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'xss':
      return 'XSS';
    case 'csrf':
      return 'CSRF';
    case 'csp':
      return 'CSP';
    case 'dependency':
      return 'Dependencies';
    case 'secret':
      return 'Secrets';
    case 'tls':
      return 'TLS/SSL';
    case 'authentication':
      return 'Authentication';
    case 'authorization':
      return 'Authorization';
    case 'injection':
      return 'Injection';
    case 'security-headers':
      return 'Security Headers';
    case 'configuration':
      return 'Configuration';
    default:
      return capitalize(category);
  }
}

/**
 * Format duration in milliseconds to readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${(ms / 60000).toFixed(1)}m`;
  }
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
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Escape HTML to prevent XSS in display
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}

/**
 * Get element selector path
 */
export function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.toString().split(/\s+/).join('.');
    return `${element.tagName.toLowerCase()}.${classes}`;
  }
  
  let selector = element.tagName.toLowerCase();
  let parent = element.parentElement;
  
  while (parent && parent !== document.body) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);
    selector = `${parent.tagName.toLowerCase()} > :nth-child(${index + 1}) ${selector}`;
    element = parent;
    parent = parent.parentElement;
  }
  
  return selector;
}

/**
 * Download text as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}
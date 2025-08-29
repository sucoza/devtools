/**
 * URL matching utilities for request interception
 */

export function matchUrl(url: string, pattern: string): boolean {
  // If pattern is empty, match all
  if (!pattern) {
    return true;
  }

  // Exact match
  if (url === pattern) {
    return true;
  }

  // Wildcard match
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars
      .replace(/\*/g, '.*'); // replace * with .*
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }

  // Regex pattern match (if pattern starts and ends with /)
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    try {
      const regex = new RegExp(pattern.slice(1, -1));
      return regex.test(url);
    } catch {
      return false;
    }
  }

  // Substring match
  return url.includes(pattern);
}

export function extractUrlParts(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      searchParams: Object.fromEntries(urlObj.searchParams),
      hash: urlObj.hash,
    };
  } catch {
    return null;
  }
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash from pathname unless it's the root
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}
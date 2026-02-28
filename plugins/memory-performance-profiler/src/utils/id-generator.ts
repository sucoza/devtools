// Re-export shared ID generation utilities
export { 
  generateId as baseGenerateId, 
  generateUUID, 
  generateShortId, 
  generateTimestampId, 
  getTimestamp 
} from '@sucoza/devtools-common';

/**
 * Generate a unique ID with optional prefix (plugin-specific)
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
}

/**
 * Generate a memory snapshot ID
 */
export function generateSnapshotId(): string {
  return generateId('snapshot');
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return generateId('session');
}

/**
 * Generate a warning ID
 */
export function generateWarningId(): string {
  return generateId('warning');
}

/**
 * Generate a recommendation ID
 */
export function generateRecommendationId(): string {
  return generateId('recommendation');
}

/**
 * Generate a leak pattern ID
 */
export function generateLeakPatternId(): string {
  return generateId('leak');
}

/**
 * Generate a component ID based on component name and fiber info
 */
export function generateComponentId(componentName: string, fiberKey?: string | number): string {
  const baseId = componentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const suffix = fiberKey ? `_${fiberKey}` : `_${Math.random().toString(36).substring(2, 8)}`;
  return `component_${baseId}${suffix}`;
}

/**
 * Generate a GC event ID
 */
export function generateGCEventId(): string {
  return generateId('gc');
}

/**
 * Validate if a string is a valid generated ID
 */
export function isValidGeneratedId(id: string): boolean {
  // Check if it matches the pattern: [prefix_]timestamp_randompart
  const pattern = /^(?:[a-z]+_)?[0-9a-z]+_[0-9a-z]+$/;
  return pattern.test(id);
}

/**
 * Extract timestamp from generated ID (if possible)
 */
export function extractTimestampFromId(id: string): number | null {
  try {
    const parts = id.split('_');
    if (parts.length >= 2) {
      // The timestamp is either the first part (no prefix) or second part (with prefix)
      const timestampPart = parts.length === 2 ? parts[0] : parts[1];
      const timestamp = parseInt(timestampPart, 36);
      
      // Validate that this looks like a reasonable timestamp
      const now = Date.now();
      const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
      const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000);
      
      if (timestamp >= oneYearAgo && timestamp <= oneYearFromNow) {
        return timestamp;
      }
    }
  } catch {
    // Invalid base36 number or other parsing error
  }
  
  return null;
}

/**
 * Generate a short hash for debugging purposes
 */
export function generateShortHash(input: string = ''): string {
  let hash = 0;
  const str = input || Date.now().toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36).substring(0, 6);
}

/**
 * Create a deterministic ID based on input data
 */
export function createDeterministicId(data: any, prefix: string = ''): string {
  const serialized = JSON.stringify(data);
  const hash = generateShortHash(serialized);
  const timestamp = Date.now().toString(36);
  
  return prefix ? `${prefix}_${timestamp}_${hash}` : `${timestamp}_${hash}`;
}
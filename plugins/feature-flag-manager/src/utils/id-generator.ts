// Re-export shared ID generation utilities
export { 
  generateId, 
  generateUUID, 
  generateShortId, 
  generateTimestampId, 
  getTimestamp 
} from '@sucoza/devtools-common';

/**
 * Generate a deterministic ID from a string (plugin-specific)
 */
export function generateDeterministicId(input: string): string {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}
/**
 * Generate a unique ID using crypto.randomUUID if available, otherwise fallback to timestamp + random
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a short ID for display purposes
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 8);
}

/**
 * Generate a deterministic ID from a string
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
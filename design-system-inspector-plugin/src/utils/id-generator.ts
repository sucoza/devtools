/**
 * Simple ID generator for design system entities
 */

let idCounter = 0;

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `ds-${Date.now()}-${++idCounter}`;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}
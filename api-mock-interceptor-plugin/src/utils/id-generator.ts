// Generate unique IDs for API calls, rules, etc.
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate timestamp
export function getTimestamp(): number {
  return Date.now();
}
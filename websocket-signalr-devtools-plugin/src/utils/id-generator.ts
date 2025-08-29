let counter = 0;

export function generateId(): string {
  return `${Date.now()}-${++counter}`;
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
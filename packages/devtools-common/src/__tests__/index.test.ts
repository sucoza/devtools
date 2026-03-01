import { describe, it, expect } from 'vitest';
import {
  // Formatters
  formatBytes,
  formatDuration,
  formatTimestamp,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  truncateString,
  formatUrl,
  formatJson,
  formatError,
  formatStackTrace,
  formatHttpStatus,
  generateId,
  generateUUID,
  generateShortId,
  generateTimestampId,
  getTimestamp,
  escapeCsvField,
  escapeHtml,
  // Validators
  validateEmail,
  validateUrl,
  validateNumberRange,
  validateStringLength,
  validateRequiredFields,
  validateJSON,
  validateRegex,
  validateConfig,
  // Exporters
  importFromJSON,
} from '../index';

describe('devtools-common exports', () => {
  it('exports all formatter functions', () => {
    expect(formatBytes).toBeTypeOf('function');
    expect(formatDuration).toBeTypeOf('function');
    expect(formatTimestamp).toBeTypeOf('function');
    expect(formatDateTime).toBeTypeOf('function');
    expect(formatRelativeTime).toBeTypeOf('function');
    expect(formatNumber).toBeTypeOf('function');
    expect(formatPercentage).toBeTypeOf('function');
    expect(truncateString).toBeTypeOf('function');
    expect(formatUrl).toBeTypeOf('function');
    expect(formatJson).toBeTypeOf('function');
    expect(formatError).toBeTypeOf('function');
    expect(formatStackTrace).toBeTypeOf('function');
    expect(formatHttpStatus).toBeTypeOf('function');
    expect(generateId).toBeTypeOf('function');
    expect(generateUUID).toBeTypeOf('function');
    expect(generateShortId).toBeTypeOf('function');
    expect(generateTimestampId).toBeTypeOf('function');
    expect(getTimestamp).toBeTypeOf('function');
  });

  it('exports all validator functions', () => {
    expect(validateEmail).toBeTypeOf('function');
    expect(validateUrl).toBeTypeOf('function');
    expect(validateNumberRange).toBeTypeOf('function');
    expect(validateStringLength).toBeTypeOf('function');
    expect(validateRequiredFields).toBeTypeOf('function');
    expect(validateJSON).toBeTypeOf('function');
    expect(validateRegex).toBeTypeOf('function');
    expect(validateConfig).toBeTypeOf('function');
  });

  it('exports importer functions', () => {
    expect(importFromJSON).toBeTypeOf('function');
  });
});

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(2500)).toBe('2.5s');
  });

  it('formats minutes', () => {
    expect(formatDuration(90000)).toBe('1m 30s');
  });
});

describe('formatHttpStatus', () => {
  it('formats known status codes', () => {
    expect(formatHttpStatus(200)).toBe('200 OK');
    expect(formatHttpStatus(404)).toBe('404 Not Found');
    expect(formatHttpStatus(500)).toBe('500 Internal Server Error');
  });

  it('formats unknown status codes', () => {
    expect(formatHttpStatus(999)).toBe('999 Unknown');
  });
});

describe('truncateString', () => {
  it('returns short strings unchanged', () => {
    expect(truncateString('hello', 10)).toBe('hello');
  });

  it('truncates long strings', () => {
    expect(truncateString('hello world', 8)).toBe('hello...');
  });
});

describe('formatPercentage', () => {
  it('formats percentage correctly', () => {
    expect(formatPercentage(1, 4)).toBe('25.0%');
  });

  it('handles zero total', () => {
    expect(formatPercentage(0, 0)).toBe('0%');
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('generateUUID', () => {
  it('generates valid UUID format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('escapeCsvField', () => {
  it('returns plain values unchanged', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField('123')).toBe('123');
  });

  it('wraps values containing commas in double quotes', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  it('wraps values containing double quotes and escapes them', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps values containing newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('handles values with commas, quotes, and newlines together', () => {
    expect(escapeCsvField('a "b", c\nd')).toBe('"a ""b"", c\nd"');
  });

  it('converts non-string values to strings', () => {
    expect(escapeCsvField(42)).toBe('42');
    expect(escapeCsvField(true)).toBe('true');
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  it('handles empty string', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes quotes', () => {
    expect(escapeHtml('say "hello" & \'bye\'')).toBe(
      'say &quot;hello&quot; &amp; &#39;bye&#39;'
    );
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('handles numbers', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('formatDuration negative values', () => {
  it('handles negative milliseconds', () => {
    expect(formatDuration(-500)).toBe('-500ms');
  });

  it('handles negative seconds', () => {
    expect(formatDuration(-2500)).toBe('-2.5s');
  });

  it('handles negative minutes', () => {
    expect(formatDuration(-90000)).toBe('-1m 30s');
  });
});

describe('validateEmail', () => {
  it('validates correct emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('validates correct URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(validateUrl('not-a-url')).toBe(false);
  });
});

describe('validateJSON', () => {
  it('validates correct JSON', () => {
    const result = validateJSON('{"key": "value"}');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid JSON', () => {
    const result = validateJSON('not json');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateNumberRange', () => {
  it('validates numbers within range', () => {
    const result = validateNumberRange(5, 1, 10);
    expect(result.isValid).toBe(true);
  });

  it('rejects numbers outside range', () => {
    const result = validateNumberRange(15, 1, 10);
    expect(result.isValid).toBe(false);
  });
});

describe('importFromJSON', () => {
  it('parses valid export data', () => {
    const json = JSON.stringify({
      plugin: 'test',
      version: '1.0.0',
      timestamp: Date.now(),
      data: { key: 'value' },
    });
    const result = importFromJSON(json);
    expect(result.plugin).toBe('test');
    expect(result.data).toEqual({ key: 'value' });
  });

  it('throws on invalid structure', () => {
    expect(() => importFromJSON('{"invalid": true}')).toThrow();
  });
});

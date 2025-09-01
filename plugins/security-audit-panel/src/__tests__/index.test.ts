import { describe, test, expect } from 'vitest';
import * as SecurityAuditPanel from '../index';

describe('Security Audit Panel Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(SecurityAuditPanel).toBeDefined();
    expect(typeof SecurityAuditPanel).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(SecurityAuditPanel);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(SecurityAuditPanel).toHaveProperty('default');
    expect(typeof SecurityAuditPanel.default).toBe('function');
  });
});
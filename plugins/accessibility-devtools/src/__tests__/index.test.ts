import { describe, test, expect } from 'vitest';
import * as AccessibilityDevTools from '../index';

describe('Accessibility DevTools Plugin Exports', () => {
  test('should export main panel component', () => {
    expect(AccessibilityDevTools.AccessibilityDevToolsPanel).toBeDefined();
    expect(typeof AccessibilityDevTools.AccessibilityDevToolsPanel).toBe('function');
  });

  test('should export default component', () => {
    expect(AccessibilityDevTools.default).toBeDefined();
    expect(typeof AccessibilityDevTools.default).toBe('function');
  });

  test('should export event client functions', () => {
    expect(AccessibilityDevTools.createAccessibilityDevToolsEventClient).toBeDefined();
    expect(AccessibilityDevTools.getAccessibilityDevToolsEventClient).toBeDefined();
    expect(AccessibilityDevTools.resetAccessibilityDevToolsEventClient).toBeDefined();
    expect(AccessibilityDevTools.AccessibilityDevToolsEventClient).toBeDefined();
  });

  test('should export store functions', () => {
    expect(AccessibilityDevTools.useAccessibilityDevToolsStore).toBeDefined();
    expect(AccessibilityDevTools.getAccessibilityDevToolsStore).toBeDefined();
  });

  test('should export hook', () => {
    expect(AccessibilityDevTools.useAccessibilityAudit).toBeDefined();
    expect(typeof AccessibilityDevTools.useAccessibilityAudit).toBe('function');
  });
});
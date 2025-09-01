import { describe, it, expect } from 'vitest';
import * as exports from '../index';

describe('render-waste-detector exports', () => {
  it('should export RenderWasteDetectorPanel component', () => {
    expect(exports.RenderWasteDetectorPanel).toBeDefined();
    expect(typeof exports.RenderWasteDetectorPanel).toBe('function');
  });

  it('should export core functionality', () => {
    expect(exports.useRenderWasteDetectorStore).toBeDefined();
    expect(exports.getRenderWasteDetectorStore).toBeDefined();
    expect(exports.createRenderWasteDetectorEventClient).toBeDefined();
    expect(exports.getRenderWasteDetectorEventClient).toBeDefined();
    expect(exports.resetRenderWasteDetectorEventClient).toBeDefined();
    expect(exports.getProfilerIntegration).toBeDefined();
    expect(exports.startRenderProfiling).toBeDefined();
    expect(exports.stopRenderProfiling).toBeDefined();
    expect(exports.OptimizationEngine).toBeDefined();
  });

  it('should have proper function types for exported functions', () => {
    expect(typeof exports.useRenderWasteDetectorStore).toBe('function');
    expect(typeof exports.getRenderWasteDetectorStore).toBe('function');
    expect(typeof exports.createRenderWasteDetectorEventClient).toBe('function');
    expect(typeof exports.getRenderWasteDetectorEventClient).toBe('function');
    expect(typeof exports.resetRenderWasteDetectorEventClient).toBe('function');
    expect(typeof exports.getProfilerIntegration).toBe('function');
    expect(typeof exports.startRenderProfiling).toBe('function');
    expect(typeof exports.stopRenderProfiling).toBe('function');
    expect(typeof exports.OptimizationEngine).toBe('function');
  });
});
import { describe, it, expect } from 'vitest';
import * as RenderWasteDetectorPlugin from './index';

describe('Render Waste Detector Plugin - Main Exports', () => {
  it('should export RenderWasteDetectorPanel component', () => {
    expect(RenderWasteDetectorPlugin.RenderWasteDetectorPanel).toBeDefined();
    expect(typeof RenderWasteDetectorPlugin.RenderWasteDetectorPanel).toBe('function');
  });

  it('should export default component', () => {
    expect(RenderWasteDetectorPlugin.default).toBeDefined();
    expect(typeof RenderWasteDetectorPlugin.default).toBe('function');
  });

  it('should export core functionality', () => {
    expect(RenderWasteDetectorPlugin.useRenderWasteDetectorStore).toBeDefined();
    expect(RenderWasteDetectorPlugin.getRenderWasteDetectorStore).toBeDefined();
    expect(RenderWasteDetectorPlugin.createRenderWasteDetectorDevToolsClient).toBeDefined();
    expect(RenderWasteDetectorPlugin.getRenderWasteDetectorDevToolsClient).toBeDefined();
    expect(RenderWasteDetectorPlugin.resetRenderWasteDetectorDevToolsClient).toBeDefined();
    expect(RenderWasteDetectorPlugin.getProfilerIntegration).toBeDefined();
    expect(RenderWasteDetectorPlugin.startRenderProfiling).toBeDefined();
    expect(RenderWasteDetectorPlugin.stopRenderProfiling).toBeDefined();
    expect(RenderWasteDetectorPlugin.OptimizationEngine).toBeDefined();
  });

  it('should export hooks', () => {
    expect(RenderWasteDetectorPlugin.useRenderWasteDetector).toBeDefined();
    expect(typeof RenderWasteDetectorPlugin.useRenderWasteDetector).toBe('function');
  });
});

/**
 * Visual Regression Testing Module
 * Export all visual regression testing components
 */

export { BaselineManager } from './baseline-manager';
export { DiffEngine } from './diff-engine';

// Types from baseline-manager
export type {
  BaselineImage,
  BaselineMetadata,
  ViewportConfig,
  BaselineSet,
  BaselineStorageConfig,
  VisualComparisonResult,
  DiffRegion,
} from './baseline-manager';

// Types from diff-engine
export type {
  DiffOptions,
  DiffResult,
  DiffAnalysis,
  DetailedDiffRegion,
  IgnoreRegion,
  ChangeType,
  PixelMatchOptions,
  LayoutShift,
  LayoutShiftSource,
} from './diff-engine';
/**
 * Visual Regression Testing Module
 * Export all visual regression testing components
 */

export { BaselineManager } from './baseline-manager';
export { DiffEngine } from './diff-engine';
export type {
  BaselineImage,
  BaselineMetadata,
  ViewportConfig,
  BaselineSet,
  BaselineStorageConfig,
  VisualComparisonResult,
  DiffRegion,
  DiffOptions,
  DiffResult,
  DiffAnalysis,
  DetailedDiffRegion,
  IgnoreRegion,
  ChangeType,
} from './baseline-manager';
export type {
  PixelMatchOptions,
  LayoutShift,
  LayoutShiftSource,
} from './diff-engine';
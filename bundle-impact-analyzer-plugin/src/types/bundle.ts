export interface BundleModule {
  id: string;
  name: string;
  size: number;
  gzipSize?: number;
  path: string;
  imports: string[];
  exports: string[];
  isTreeShakeable: boolean;
  isDynamic: boolean;
  chunk?: string;
  usedExports?: string[];
  unusedExports?: string[];
  reasons?: ModuleReason[];
  timestamp: number;
}

export interface ModuleReason {
  type: 'import' | 'require' | 'dynamic-import' | 'entry';
  module: string;
  loc?: string;
  explanation?: string;
}

export interface BundleChunk {
  id: string;
  name: string;
  size: number;
  gzipSize?: number;
  modules: BundleModule[];
  parents: string[];
  children: string[];
  isEntry: boolean;
  isAsync: boolean;
  files: string[];
  timestamp: number;
}

export interface BundleStats {
  totalSize: number;
  totalGzipSize: number;
  moduleCount: number;
  chunkCount: number;
  duplicateModules: DuplicateModule[];
  treeShakingEfficiency: number;
  unusedCodeSize: number;
  timestamp: number;
}

export interface DuplicateModule {
  name: string;
  chunks: string[];
  totalSize: number;
  count: number;
}

export interface ImportImpact {
  module: string;
  sizeAdded: number;
  dependenciesAdded: string[];
  treeshakingPotential: number;
  recommendation: OptimizationRecommendation;
}

export interface OptimizationRecommendation {
  type: 'code-split' | 'tree-shake' | 'cdn-replace' | 'remove-unused' | 'deduplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedSavings: number;
  implementation: string;
  module?: string;
  chunks?: string[];
}

export interface ChunkVisualization {
  id: string;
  name: string;
  size: number;
  color: string;
  position: { x: number; y: number };
  dependencies: string[];
  modules: ModuleVisualization[];
}

export interface ModuleVisualization {
  id: string;
  name: string;
  size: number;
  color: string;
  position: { x: number; y: number };
  isTreeShaken?: boolean;
  isUnused?: boolean;
}

export interface BundleBuildInfo {
  buildTool: 'webpack' | 'vite' | 'rollup' | 'esbuild' | 'parcel' | 'unknown';
  buildTime: number;
  environment: 'development' | 'production';
  optimization: {
    minimize: boolean;
    treeShaking: boolean;
    splitChunks: boolean;
    sideEffects: boolean | string[];
  };
  warnings: string[];
  errors: string[];
}

export interface CDNAnalysis {
  module: string;
  cdnUrl?: string;
  cdnSize: number;
  bundleSize: number;
  savingsPotential: number;
  compatibility: 'high' | 'medium' | 'low';
  recommendation: 'use-cdn' | 'keep-bundled' | 'conditional';
}
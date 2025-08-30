import type {
  BundleModule,
  BundleChunk,
  BundleStats,
  ImportImpact,
  OptimizationRecommendation,
  BundleBuildInfo,
  CDNAnalysis,
} from './bundle';

export interface BundleAnalyzerState {
  modules: BundleModule[];
  chunks: BundleChunk[];
  stats: BundleStats;
  buildInfo: BundleBuildInfo | null;
  importImpacts: ImportImpact[];
  recommendations: OptimizationRecommendation[];
  cdnAnalysis: CDNAnalysis[];
  isAnalyzing: boolean;
  lastAnalysisTime: number | null;
  selectedModule: string | null;
  selectedChunk: string | null;
  filters: {
    showOnlyLargeModules: boolean;
    showOnlyUnusedCode: boolean;
    showOnlyDuplicates: boolean;
    minimumSize: number;
    searchQuery: string;
  };
  visualization: {
    viewMode: 'tree' | 'sunburst' | 'treemap' | 'network';
    zoomLevel: number;
    selectedNode: string | null;
  };
  config: BundleAnalyzerConfig;
  jobs: AnalysisJob[];
}

export interface BundleAnalyzerEvent {
  type: 'bundle-analyzed' | 'module-updated' | 'chunk-updated' | 'analysis-started' | 'analysis-error';
  data?: unknown;
  timestamp: number;
}

export interface BundleAnalyzerConfig {
  enableRealTimeTracking: boolean;
  trackDynamicImports: boolean;
  analyzeTreeShaking: boolean;
  detectDuplicates: boolean;
  cdnAnalysis: boolean;
  visualizationEnabled: boolean;
  thresholds: {
    largeModuleSize: number;
    criticalRecommendationThreshold: number;
    treeShakingEfficiencyThreshold: number;
  };
}

export interface DevToolsMessage {
  type: 'bundle-impact-analyzer';
  subtype: 'init' | 'update' | 'analyze' | 'config-change';
  payload: unknown;
  timestamp: number;
}

export interface AnalysisJob {
  id: string;
  type: 'full-analysis' | 'incremental-update' | 'tree-shaking-analysis' | 'cdn-analysis';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
  result?: unknown;
}
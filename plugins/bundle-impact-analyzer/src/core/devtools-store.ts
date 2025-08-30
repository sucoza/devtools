import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  BundleAnalyzerState,
  BundleAnalyzerConfig,
  BundleModule,
  BundleChunk,
  BundleStats,
  ImportImpact,
  OptimizationRecommendation,
  BundleBuildInfo,
  CDNAnalysis,
  AnalysisJob,
} from '../types';

/**
 * Initial state for bundle impact analyzer DevTools
 */
const initialState: Omit<BundleAnalyzerState, 'config' | 'jobs'> = {
  modules: [],
  chunks: [],
  stats: {
    totalSize: 0,
    totalGzipSize: 0,
    moduleCount: 0,
    chunkCount: 0,
    duplicateModules: [],
    treeShakingEfficiency: 0,
    unusedCodeSize: 0,
    timestamp: Date.now(),
  },
  buildInfo: null,
  importImpacts: [],
  recommendations: [],
  cdnAnalysis: [],
  isAnalyzing: false,
  lastAnalysisTime: null,
  selectedModule: null,
  selectedChunk: null,
  filters: {
    showOnlyLargeModules: false,
    showOnlyUnusedCode: false,
    showOnlyDuplicates: false,
    minimumSize: 0,
    searchQuery: '',
  },
  visualization: {
    viewMode: 'treemap',
    zoomLevel: 1,
    selectedNode: null,
  },
};

/**
 * Bundle analyzer DevTools store interface
 */
interface BundleAnalyzerStore extends BundleAnalyzerState {
  // Core analysis methods
  startAnalysis: () => void;
  stopAnalysis: () => void;
  updateModules: (modules: BundleModule[]) => void;
  updateChunks: (chunks: BundleChunk[]) => void;
  updateStats: (stats: Partial<BundleStats>) => void;
  setBuildInfo: (buildInfo: BundleBuildInfo) => void;
  
  // Module and chunk management
  addModule: (module: BundleModule) => void;
  removeModule: (moduleId: string) => void;
  updateModule: (moduleId: string, updates: Partial<BundleModule>) => void;
  selectModule: (moduleId: string | null) => void;
  selectChunk: (chunkId: string | null) => void;
  
  // Analysis and recommendations
  generateRecommendations: () => void;
  analyzeImportImpact: (importPath: string) => ImportImpact | null;
  analyzeCDNOpportunities: () => void;
  analyzeTreeShaking: () => void;
  
  // Filtering and visualization
  updateFilters: (filters: Partial<BundleAnalyzerState['filters']>) => void;
  updateVisualization: (viz: Partial<BundleAnalyzerState['visualization']>) => void;
  clearFilters: () => void;
  
  // Utility methods
  getFilteredModules: () => BundleModule[];
  getModuleById: (id: string) => BundleModule | null;
  getChunkById: (id: string) => BundleChunk | null;
  getTotalBundleSize: () => number;
  getUnusedCodeSize: () => number;
  
  // Configuration
  config: BundleAnalyzerConfig;
  updateConfig: (config: Partial<BundleAnalyzerConfig>) => void;
  
  // Analysis jobs
  jobs: AnalysisJob[];
  startJob: (job: Omit<AnalysisJob, 'id' | 'startTime'>) => string;
  updateJob: (jobId: string, updates: Partial<AnalysisJob>) => void;
  completeJob: (jobId: string, result?: unknown) => void;
  failJob: (jobId: string, error: string) => void;
}

/**
 * Create bundle analyzer DevTools store
 */
export const useBundleAnalyzerStore = create<BundleAnalyzerStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    jobs: [],
    config: {
      enableRealTimeTracking: true,
      trackDynamicImports: true,
      analyzeTreeShaking: true,
      detectDuplicates: true,
      cdnAnalysis: false,
      visualizationEnabled: true,
      thresholds: {
        largeModuleSize: 100 * 1024, // 100KB
        criticalRecommendationThreshold: 500 * 1024, // 500KB
        treeShakingEfficiencyThreshold: 0.8, // 80%
      },
    },

    /**
     * Core analysis methods
     */
    startAnalysis: () => {
      const jobId = get().startJob({
        type: 'full-analysis',
        status: 'running',
        progress: 0,
      });
      
      set(() => ({
        isAnalyzing: true,
        lastAnalysisTime: Date.now(),
      }));

      // Simulate analysis progress
      const interval = setInterval(() => {
        const job = get().jobs.find(j => j.id === jobId);
        if (job && job.progress < 100) {
          get().updateJob(jobId, { progress: job.progress + 10 });
        } else {
          clearInterval(interval);
          get().completeJob(jobId, { message: 'Analysis complete' });
          set(() => ({ isAnalyzing: false }));
        }
      }, 200);
    },

    stopAnalysis: () => {
      set(state => ({
        isAnalyzing: false,
        jobs: state.jobs.map(job => 
          job.status === 'running' ? { ...job, status: 'failed', error: 'Analysis stopped' } : job
        ),
      }));
    },

    updateModules: (modules: BundleModule[]) => {
      set(state => ({
        modules,
        stats: {
          ...state.stats,
          moduleCount: modules.length,
          totalSize: modules.reduce((sum, mod) => sum + mod.size, 0),
          totalGzipSize: modules.reduce((sum, mod) => sum + (mod.gzipSize || 0), 0),
          timestamp: Date.now(),
        },
      }));
      get().generateRecommendations();
    },

    updateChunks: (chunks: BundleChunk[]) => {
      set(state => ({
        chunks,
        stats: {
          ...state.stats,
          chunkCount: chunks.length,
          timestamp: Date.now(),
        },
      }));
    },

    updateStats: (stats: Partial<BundleStats>) => {
      set(state => ({
        stats: { ...state.stats, ...stats, timestamp: Date.now() },
      }));
    },

    setBuildInfo: (buildInfo: BundleBuildInfo) => {
      set({ buildInfo });
    },

    /**
     * Module and chunk management
     */
    addModule: (module: BundleModule) => {
      set(state => ({
        modules: [...state.modules, module],
      }));
      get().updateStats({
        moduleCount: get().modules.length,
        totalSize: get().modules.reduce((sum, mod) => sum + mod.size, 0),
      });
    },

    removeModule: (moduleId: string) => {
      set(state => ({
        modules: state.modules.filter(mod => mod.id !== moduleId),
        selectedModule: state.selectedModule === moduleId ? null : state.selectedModule,
      }));
    },

    updateModule: (moduleId: string, updates: Partial<BundleModule>) => {
      set(state => ({
        modules: state.modules.map(mod =>
          mod.id === moduleId ? { ...mod, ...updates, timestamp: Date.now() } : mod
        ),
      }));
    },

    selectModule: (moduleId: string | null) => {
      set({ selectedModule: moduleId });
    },

    selectChunk: (chunkId: string | null) => {
      set({ selectedChunk: chunkId });
    },

    /**
     * Analysis and recommendations
     */
    generateRecommendations: () => {
      const state = get();
      const recommendations: OptimizationRecommendation[] = [];
      const { modules, config } = state;

      // Large module recommendations
      modules.forEach(module => {
        if (module.size > config.thresholds.largeModuleSize) {
          recommendations.push({
            type: 'code-split',
            severity: module.size > config.thresholds.criticalRecommendationThreshold ? 'critical' : 'high',
            description: `Module "${module.name}" is large (${(module.size / 1024).toFixed(1)}KB). Consider code splitting.`,
            estimatedSavings: module.size * 0.3, // Estimate 30% savings from splitting
            implementation: `Consider using dynamic imports: import('${module.path}').then(...)`,
            module: module.id,
          });
        }

        // Unused exports recommendations
        if (module.unusedExports && module.unusedExports.length > 0) {
          const unusedSize = module.size * (module.unusedExports.length / (module.exports.length || 1));
          recommendations.push({
            type: 'tree-shake',
            severity: unusedSize > 10 * 1024 ? 'medium' : 'low',
            description: `Module "${module.name}" has ${module.unusedExports.length} unused exports.`,
            estimatedSavings: unusedSize,
            implementation: `Remove unused exports: ${module.unusedExports.join(', ')}`,
            module: module.id,
          });
        }
      });

      // Duplicate module recommendations
      const moduleNames = new Map<string, BundleModule[]>();
      modules.forEach(module => {
        const name = module.name;
        if (!moduleNames.has(name)) {
          moduleNames.set(name, []);
        }
        const moduleList = moduleNames.get(name);
        if (moduleList) {
          moduleList.push(module);
        }
      });

      moduleNames.forEach((mods, name) => {
        if (mods.length > 1) {
          const totalDuplicateSize = mods.reduce((sum, mod) => sum + mod.size, 0) - mods[0].size;
          recommendations.push({
            type: 'deduplicate',
            severity: totalDuplicateSize > 50 * 1024 ? 'high' : 'medium',
            description: `Module "${name}" is duplicated in ${mods.length} chunks.`,
            estimatedSavings: totalDuplicateSize,
            implementation: 'Configure chunk splitting to share common modules.',
            chunks: mods.map(mod => mod.chunk).filter(Boolean) as string[],
          });
        }
      });

      // Tree-shaking efficiency
      const totalUsedExports = modules.reduce((sum, mod) => sum + (mod.usedExports?.length || mod.exports.length), 0);
      const totalExports = modules.reduce((sum, mod) => sum + mod.exports.length, 0);
      const treeShakingEfficiency = totalExports > 0 ? totalUsedExports / totalExports : 1;

      if (treeShakingEfficiency < config.thresholds.treeShakingEfficiencyThreshold) {
        recommendations.push({
          type: 'tree-shake',
          severity: 'medium',
          description: `Tree-shaking efficiency is ${(treeShakingEfficiency * 100).toFixed(1)}%. Consider improving.`,
          estimatedSavings: state.stats.totalSize * (1 - treeShakingEfficiency) * 0.5,
          implementation: 'Enable sideEffects: false in package.json and use ES modules.',
        });
      }

      set(state => ({
        recommendations: recommendations.sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }),
        stats: {
          ...state.stats,
          treeShakingEfficiency,
          unusedCodeSize: modules.reduce((sum, mod) => {
            const unusedRatio = (mod.unusedExports?.length || 0) / (mod.exports.length || 1);
            return sum + (mod.size * unusedRatio);
          }, 0),
        },
      }));
    },

    analyzeImportImpact: (importPath: string): ImportImpact | null => {
      const state = get();
      const module = state.modules.find(mod => mod.path === importPath || mod.name === importPath);
      
      if (!module) return null;

      const dependenciesAdded: string[] = [];
      const calculateDependencies = (mod: BundleModule) => {
        mod.imports.forEach(imp => {
          if (!dependenciesAdded.includes(imp)) {
            dependenciesAdded.push(imp);
            const depModule = state.modules.find(m => m.path === imp || m.name === imp);
            if (depModule) {
              calculateDependencies(depModule);
            }
          }
        });
      };
      calculateDependencies(module);

      const treeshakingPotential = module.isTreeShakeable && module.unusedExports 
        ? (module.unusedExports.length / module.exports.length) * module.size
        : 0;

      return {
        module: module.name,
        sizeAdded: module.size + dependenciesAdded.reduce((sum, dep) => {
          const depMod = state.modules.find(m => m.path === dep || m.name === dep);
          return sum + (depMod?.size || 0);
        }, 0),
        dependenciesAdded,
        treeshakingPotential,
        recommendation: treeshakingPotential > 10 * 1024 ? {
          type: 'tree-shake',
          severity: 'medium',
          description: `Import only needed exports from "${module.name}".`,
          estimatedSavings: treeshakingPotential,
          implementation: `Use named imports: import { specific } from '${module.path}'`,
          module: module.id,
        } : {
          type: 'remove-unused',
          severity: 'low',
          description: `Module "${module.name}" appears to be efficiently imported.`,
          estimatedSavings: 0,
          implementation: 'No action needed.',
          module: module.id,
        },
      };
    },

    analyzeCDNOpportunities: () => {
      const jobId = get().startJob({
        type: 'cdn-analysis',
        status: 'running',
        progress: 0,
      });

      const state = get();
      const cdnAnalysis: CDNAnalysis[] = [];

      // Common libraries that are good CDN candidates
      const cdnCandidates = new Map([
        ['react', { url: 'https://unpkg.com/react@18/umd/react.production.min.js', size: 6.4 * 1024 }],
        ['react-dom', { url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', size: 130 * 1024 }],
        ['lodash', { url: 'https://unpkg.com/lodash@4/lodash.min.js', size: 69 * 1024 }],
        ['moment', { url: 'https://unpkg.com/moment@2/min/moment.min.js', size: 67 * 1024 }],
        ['chart.js', { url: 'https://unpkg.com/chart.js@4/dist/chart.umd.js', size: 147 * 1024 }],
      ]);

      state.modules.forEach(module => {
        const libName = module.name.split('/')[0];
        const cdnInfo = cdnCandidates.get(libName);
        
        if (cdnInfo) {
          const savingsPotential = module.size - cdnInfo.size;
          const compatibility = savingsPotential > 0 ? 'high' : 'low';
          
          cdnAnalysis.push({
            module: module.name,
            cdnUrl: cdnInfo.url,
            cdnSize: cdnInfo.size,
            bundleSize: module.size,
            savingsPotential,
            compatibility,
            recommendation: savingsPotential > 10 * 1024 ? 'use-cdn' : 'keep-bundled',
          });
        }
      });

      setTimeout(() => {
        get().completeJob(jobId, cdnAnalysis);
        set({ cdnAnalysis });
      }, 1000);
    },

    analyzeTreeShaking: () => {
      const jobId = get().startJob({
        type: 'tree-shaking-analysis',
        status: 'running',
        progress: 0,
      });

      // Simulate tree-shaking analysis
      setTimeout(() => {
        get().generateRecommendations();
        get().completeJob(jobId, { message: 'Tree-shaking analysis complete' });
      }, 800);
    },

    /**
     * Filtering and visualization
     */
    updateFilters: (filters: Partial<BundleAnalyzerState['filters']>) => {
      set(state => ({
        filters: { ...state.filters, ...filters },
      }));
    },

    updateVisualization: (viz: Partial<BundleAnalyzerState['visualization']>) => {
      set(state => ({
        visualization: { ...state.visualization, ...viz },
      }));
    },

    clearFilters: () => {
      set(() => ({
        filters: {
          showOnlyLargeModules: false,
          showOnlyUnusedCode: false,
          showOnlyDuplicates: false,
          minimumSize: 0,
          searchQuery: '',
        },
      }));
    },

    /**
     * Utility methods
     */
    getFilteredModules: (): BundleModule[] => {
      const state = get();
      const { modules, filters, config } = state;

      let filtered = modules;

      if (filters.showOnlyLargeModules) {
        filtered = filtered.filter(mod => mod.size > config.thresholds.largeModuleSize);
      }

      if (filters.showOnlyUnusedCode) {
        filtered = filtered.filter(mod => mod.unusedExports && mod.unusedExports.length > 0);
      }

      if (filters.showOnlyDuplicates) {
        const moduleNames = new Map<string, number>();
        modules.forEach(mod => {
          moduleNames.set(mod.name, (moduleNames.get(mod.name) || 0) + 1);
        });
        filtered = filtered.filter(mod => (moduleNames.get(mod.name) || 0) > 1);
      }

      if (filters.minimumSize > 0) {
        filtered = filtered.filter(mod => mod.size >= filters.minimumSize);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(mod =>
          mod.name.toLowerCase().includes(query) ||
          mod.path.toLowerCase().includes(query)
        );
      }

      return filtered;
    },

    getModuleById: (id: string): BundleModule | null => {
      return get().modules.find(mod => mod.id === id) || null;
    },

    getChunkById: (id: string): BundleChunk | null => {
      return get().chunks.find(chunk => chunk.id === id) || null;
    },

    getTotalBundleSize: (): number => {
      return get().modules.reduce((sum, mod) => sum + mod.size, 0);
    },

    getUnusedCodeSize: (): number => {
      return get().modules.reduce((sum, mod) => {
        if (!mod.unusedExports || mod.unusedExports.length === 0) return sum;
        const unusedRatio = mod.unusedExports.length / (mod.exports.length || 1);
        return sum + (mod.size * unusedRatio);
      }, 0);
    },

    /**
     * Configuration
     */
    updateConfig: (config: Partial<BundleAnalyzerConfig>) => {
      set(state => ({
        config: { ...state.config, ...config },
      }));
    },

    /**
     * Analysis jobs
     */
    startJob: (job: Omit<AnalysisJob, 'id' | 'startTime'>): string => {
      const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newJob: AnalysisJob = {
        ...job,
        id,
        startTime: Date.now(),
      };

      set(state => ({
        jobs: [...state.jobs, newJob],
      }));

      return id;
    },

    updateJob: (jobId: string, updates: Partial<AnalysisJob>) => {
      set(state => ({
        jobs: state.jobs.map(job =>
          job.id === jobId ? { ...job, ...updates } : job
        ),
      }));
    },

    completeJob: (jobId: string, result?: unknown) => {
      set(state => ({
        jobs: state.jobs.map(job =>
          job.id === jobId
            ? { ...job, status: 'completed', progress: 100, endTime: Date.now(), result }
            : job
        ),
      }));
    },

    failJob: (jobId: string, error: string) => {
      set(state => ({
        jobs: state.jobs.map(job =>
          job.id === jobId
            ? { ...job, status: 'failed', endTime: Date.now(), error }
            : job
        ),
      }));
    },
  }))
);

/**
 * Get bundle analyzer store instance
 */
export function getBundleAnalyzerStore() {
  return useBundleAnalyzerStore.getState();
}
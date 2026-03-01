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

let analysisInterval: ReturnType<typeof setInterval> | null = null;

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

  // Sample data generation
  generateSampleData: () => void;
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
          analysisInterval = null;
          get().completeJob(jobId, { message: 'Analysis complete' });
          set(() => ({ isAnalyzing: false }));
        }
      }, 200);
      analysisInterval = interval;
    },

    stopAnalysis: () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
        analysisInterval = null;
      }
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

      const treeshakingPotential = module.isTreeShakeable && module.unusedExports && module.exports.length > 0
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
      const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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

    /**
     * Generate sample data for development/testing
     */
    generateSampleData: () => {
      const sampleModules: BundleModule[] = [
        {
          id: 'react',
          name: 'react',
          size: 6800,
          gzipSize: 2500,
          path: 'node_modules/react/index.js',
          imports: [],
          exports: ['Component', 'createElement', 'useState', 'useEffect', 'useContext'],
          usedExports: ['Component', 'createElement', 'useState'],
          unusedExports: ['useEffect', 'useContext'],
          isTreeShakeable: true,
          isDynamic: false,
          timestamp: Date.now(),
        },
        {
          id: 'lodash',
          name: 'lodash',
          size: 71000,
          gzipSize: 25000,
          path: 'node_modules/lodash/lodash.js',
          imports: [],
          exports: ['map', 'filter', 'reduce', 'each', 'find'],
          usedExports: ['map', 'filter'],
          unusedExports: ['reduce', 'each', 'find'],
          isTreeShakeable: false,
          isDynamic: false,
          timestamp: Date.now(),
        },
        {
          id: 'app-main',
          name: 'main.js',
          size: 45000,
          gzipSize: 15000,
          path: 'src/main.js',
          imports: ['react', 'lodash'],
          exports: ['default'],
          isTreeShakeable: true,
          isDynamic: false,
          chunk: 'main',
          timestamp: Date.now(),
        },
        {
          id: 'app-utils',
          name: 'utils.js',
          size: 12000,
          gzipSize: 4000,
          path: 'src/utils.js',
          imports: [],
          exports: ['formatDate', 'formatCurrency', 'debounce'],
          usedExports: ['formatDate'],
          unusedExports: ['formatCurrency', 'debounce'],
          isTreeShakeable: true,
          isDynamic: false,
          timestamp: Date.now(),
        },
        {
          id: 'vendor-chunk',
          name: 'vendor.js',
          size: 150000,
          gzipSize: 50000,
          path: 'dist/vendor.js',
          imports: [],
          exports: [],
          isTreeShakeable: false,
          isDynamic: true,
          chunk: 'vendor',
          timestamp: Date.now(),
        },
      ];

      const sampleChunks: BundleChunk[] = [
        {
          id: 'main',
          name: 'main',
          size: 45000,
          modules: [sampleModules[2]],
          parents: [],
          children: ['vendor'],
          isEntry: true,
          isAsync: false,
          files: ['main.js'],
          timestamp: Date.now(),
        },
        {
          id: 'vendor',
          name: 'vendor',
          size: 150000,
          modules: [sampleModules[0], sampleModules[1], sampleModules[4]],
          parents: ['main'],
          children: [],
          isEntry: false,
          isAsync: true,
          files: ['vendor.js'],
          timestamp: Date.now(),
        },
      ];

      get().updateModules(sampleModules);
      get().updateChunks(sampleChunks);
      get().setBuildInfo({
        buildTool: 'vite',
        buildTime: Date.now(),
        environment: 'development',
        optimization: {
          minimize: false,
          treeShaking: true,
          splitChunks: true,
          sideEffects: false,
        },
        warnings: ['Large vendor bundle detected'],
        errors: [],
      });
    },
  }))
);

/**
 * Get bundle analyzer store instance
 */
export function getBundleAnalyzerStore() {
  return useBundleAnalyzerStore.getState();
}
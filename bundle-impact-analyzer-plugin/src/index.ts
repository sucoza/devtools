// Main plugin exports
export * from './components';
export * from './core';
export * from './types';

// Default export - main component
export { BundleImpactAnalyzerPanel as default } from './components';

// Plugin metadata
export const pluginInfo = {
  name: 'Bundle Impact Analyzer',
  version: '1.0.0',
  description: 'TanStack DevTools plugin for analyzing bundle size impact, tree-shaking effectiveness, and providing optimization recommendations',
  author: 'TanStack',
  homepage: 'https://tanstack.com',
  repository: {
    type: 'git',
    url: 'https://github.com/tanstack/bundle-impact-analyzer',
  },
  keywords: [
    'devtools',
    'bundle-analyzer',
    'webpack',
    'vite',
    'rollup',
    'tree-shaking',
    'code-splitting',
    'optimization',
    'performance',
    'chunk-analysis',
    'tanstack',
    'react'
  ],
  license: 'MIT',
};
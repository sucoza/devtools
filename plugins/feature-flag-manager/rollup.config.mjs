import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  external: [
    // React ecosystem
    'react',
    'react-dom',

    // TanStack DevTools
    '@tanstack/devtools',
    '@tanstack/devtools-event-client',
    '@tanstack/devtools-event-bus',
    '@tanstack/devtools-event-bus/server',
    '@tanstack/devtools-vite',
    '@tanstack/react-devtools',

    // State management
    'zustand',
    'zustand/middleware',
    'use-sync-external-store',
    'use-sync-external-store/shim',

    // UI libraries
    'clsx',
    'lucide-react',

    // Internationalization
    '@lingui/core',
    '@lingui/macro',
    '@lingui/react',

    // Testing
    '@testing-library/react',
    '@testing-library/jest-dom',

    // Node.js
    'vite'
  ],
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      exports: 'named',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    json(),
    resolve({
      browser: true,
      preferBuiltins: false,
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      exclude: ['**/*.test.*', '**/*.spec.*', 'example/**'],
    }),
    postcss({
      extract: false,
      inject: true,
      minimize: true,
      extensions: ['.css'],
    }),
  ],
};
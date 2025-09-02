import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@tanstack/devtools',
    '@tanstack/devtools-event-client',
    '@sucoza/shared-components',
    'zustand',
    'use-sync-external-store',
    'use-sync-external-store/shim',
    'clsx',
    'lucide-react'
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
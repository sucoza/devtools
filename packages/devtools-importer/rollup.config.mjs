import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default {
  input: {
    index: 'src/index.ts',
    react: 'src/react.tsx'
  },
  external: [
    '@tanstack/devtools',
    '@tanstack/devtools-event-bus/server',
    '@tanstack/devtools-vite',
    'react',
    'react-dom',
    'vite'
  ],
  output: [
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      entryFileNames: '[name].js',
      preserveModules: false
    }
  ],
  plugins: [
    peerDepsExternal(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      sourceMap: true,
    }),
  ],
};
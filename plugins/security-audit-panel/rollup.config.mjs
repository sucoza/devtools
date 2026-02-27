import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

export default [
  {
    input: 'src/index.ts',
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
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
      postcss({
        extract: false,
        inject: true,
        minimize: true,
      }),
    ],
    external: [
      'react',
      'react-dom',
      '@sucoza/devtools-common',
      '@sucoza/plugin-core',
      '@sucoza/shared-components',
      '@tanstack/devtools',
      '@tanstack/devtools-event-client',
      'clsx',
      'lucide-react',
      'use-sync-external-store',
      'use-sync-external-store/shim',
    ],
  },
];
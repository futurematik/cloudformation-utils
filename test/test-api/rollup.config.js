import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import builtin from 'builtin-modules';

const DEBUGGING = !!process.env.DEBUGGING;

export const external = ['cat-me'];

const noBundle = [...builtin, 'aws-sdk', ...external];

export default {
  input: 'lib/index.js',

  output: {
    file: 'lib/bundle.js',
    format: 'cjs',
    sourcemap: true,
  },

  plugins: [
    resolve(),
    commonjs(),
    json(),
    sourcemaps(),
    !DEBUGGING &&
      terser({
        output: {
          comments: false,
        },
      }),
  ].filter(Boolean),

  external: (id) => noBundle.includes(id) || id.startsWith('aws-sdk/'),
};

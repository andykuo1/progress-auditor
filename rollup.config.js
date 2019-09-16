import { terser } from 'rollup-plugin-terser';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: "./src/bin.js",
  plugins: [
    json({
      preferConst: true
    }),
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    terser()
  ],
  external: [
    "fs",
    "path",
    "os",

    // Used by libraries
    "readline",
    "stream",
    "child_process",
    "assert",
    "tty",
    "buffer",
    "util",
    "events",
    "string_decoder",
    "crypto"
  ]
};
import { terser } from "rollup-plugin-terser";

export default {
  input: "./src/bin.js",
  plugins: [terser()]
};
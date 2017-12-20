import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  name: 'Straylight',
  output: {
    file: 'dist/straylight.js',
    format: 'umd',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: ['external-helpers'],
    }),
    nodeResolve(),
    commonjs({ include: /node_modules/ }),
  ],
};

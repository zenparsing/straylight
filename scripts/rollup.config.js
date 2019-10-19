import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/straylight.js',
    format: 'es',
  },
  plugins: [
    nodeResolve(),
    commonjs({
      include: /node_modules/,
      namedExports: {
        htmltag: ['html', 'TemplateResult']
      },
    }),
  ],
};

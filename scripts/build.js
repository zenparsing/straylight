import { $ } from './exec.js';

console.log('Cleaning...');
$('git clean -qdfX ./lib ./dist');

console.log('Bundling...');
$('rollup --silent -c scripts/rollup.config.js');

console.log('Minifying...');
$('terser dist/straylight.js -c -m -o dist/straylight.min.js');

process.stdout.write('Bundle size: ');
$('gzip-size dist/straylight.min.js');
process.stdout.write('\n');

import { $ } from './exec.js';

$('git clean -dfX ./lib ./dist');

console.log('\nCompiling...\n');
$('skertc src -o lib --cjs');

console.log('Bundling...');
$('rollup -c scripts/rollup.config.js');
$('terser dist/straylight.js -c -m -o dist/straylight.min.js');

process.stdout.write('\nBundle size: ');
$('gzip-size dist/straylight.min.js');
process.stdout.write('\n');

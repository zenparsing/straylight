const $ = require('./exec.js');

$('git clean -dfX ./lib ./dist');

console.log('\n[Compiling]\n');
$('babel src --out-dir lib');

console.log('\n[Bundling]');
$('rollup -c scripts/rollup.config.js');
$('terser dist/straylight.js -c -m -o dist/straylight.min.js');

process.stdout.write('\nBundle size: ');
$('gzip-size dist/straylight.min.js');
process.stdout.write('\n');

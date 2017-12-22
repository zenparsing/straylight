const $ = require('./exec.js');

$('rimraf lib/* dist/*');

console.log('[Compiling]\n');
$('babel src --out-dir lib');

console.log('\n[Bundling]');
$('rollup -c scripts/rollup.config.js');
$('uglifyjs dist/straylight.js -c -m -o dist/straylight.min.js');

process.stdout.write('\nBundle size: ');
$('gzip-size dist/straylight.min.js');

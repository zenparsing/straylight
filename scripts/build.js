const $ = require('./exec.js');

require('./compile.js');

console.log('\n[Bundling]');
$('rollup -c scripts/rollup.config.js');
$('uglifyjs dist/straylight.js -c -m -o dist/straylight.min.js');
process.stdout.write('\nBundle size: ');
$('gzip-size dist/straylight.min.js');

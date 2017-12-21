const $ = require('./exec.js');

$('rollup -c scripts/rollup.config.js');
$('uglifyjs dist/straylight.js -c -m -o dist/straylight.min.js');
$('gzip-size dist/straylight.min.js');

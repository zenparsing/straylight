const $ = require('./exec.js');

$('rollup -c scripts/rollup.config.js');
$('uglifyjs -o dist/straylight.min.js dist/straylight.js');
$('gzip-size dist/straylight.min.js');

const { execSync } = require('child_process');
const $ = cmd => execSync(cmd, { stdio: 'inherit', env: process.env });

$('rollup -c');
$('uglifyjs -o dist/straylight.min.js dist/straylight.js');
$('gzip-size dist/straylight.min.js');

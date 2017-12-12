const { execSync } = require('child_process');
const $ = cmd => execSync(cmd, { stdio: 'inherit', env: process.env });

$('esdown - src/index.js dist/index.js -b');
$('esdown - src/index.js dist/straylight.js -b --deep -g Straylight');
$('uglifyjs -o dist/straylight.min.js dist/straylight.js');
$('gzip-size dist/straylight.min.js');

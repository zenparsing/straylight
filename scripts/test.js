const $ = require('./exec.js');

$('eslint -c scripts/.eslintrc.js src/*.js src/*/*.js test/*.js test/*/*.js');
require('./compile.js');
console.log('\n[Testing]');
$('nyc mocha');

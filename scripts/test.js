const $ = require('./exec.js');

$('eslint -c scripts/.eslintrc.js src/*.js src/*/*.js test/*.js test/*/*.js');
$('nyc mocha --require @zenparsing/skert/loader');

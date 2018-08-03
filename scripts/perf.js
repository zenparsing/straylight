const $ = require('./exec.js');

$('mocha --require babel-core/register perf/**/*.js');

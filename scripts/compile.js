const $ = require('./exec.js');

console.log('[Compiling]\n');
$('babel src --out-dir lib --presets=es2015');

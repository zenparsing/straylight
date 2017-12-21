const $ = require('./exec.js');

require('./compile.js');
console.log('\n[Testing]');
$('mocha');

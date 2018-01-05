const path = require('path');
const $ = require('./exec.js');

$('nyc report --reporter=html');
let file = path.resolve(__dirname, '../coverage/index.html');
$(`open -a 'Google Chrome' '${file}'`, { ignoreErrors: true });

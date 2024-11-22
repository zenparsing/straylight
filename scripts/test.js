import { $ } from './exec.js';

$('eslint -c scripts/eslint.config.js src/*.js src/**/*.js test/*.js test/**/*.js');
$('node ./test/index.js');

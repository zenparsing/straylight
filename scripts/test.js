import { $ } from './exec.js';

$('eslint -c scripts/.eslintrc.json src/*.js src/**/*.js test/*.js test/**/*.js');
$('nyc mocha');

import assert from 'assert';
import * as path from 'path';
import { inspect } from 'util';

/* eslint-disable */
let filename = __filename;
let dirname = __dirname;
let print = console.log.bind(console);
let exit = process.exit.bind(process);
/* eslint-enable */

function getFrames(e) {
  let lines = e.stack.split('\n');
  let first = lines.length;
  let last = 0;
  for (let i = 0; i < lines.length; ++i) {
    let line = lines[i];
    if (line.includes(filename)) {
      last = i;
      break;
    }
    if (line.includes(path.resolve(dirname, '../'))) {
      first = Math.min(first, i);
      last = Math.max(last, i);
    }
  }
  return lines.slice(first, last).join('\n');
}

const tests = [];

function test(name, fn) {
  if (typeof name === 'object') {
    Object.keys(name).forEach(key => test(key, name[key]));
    return;
  }
  tests.push({ name, fn });
}

async function runTests() {
  let fails = [];

  for (let { name, fn } of tests) {
    try {
      await fn();
    } catch (error) {
      if (error.constructor.name === 'AssertionError') {
        fails.push({ error, name });
      } else {
        print(error);
        exit(1);
      }
    }
  }

  fails.forEach(({ error, name }) => {
    print('Test Failed:', inspect(name, { colors: true }));
    print('Expected:', inspect(error.expected, { depth: 10, colors: true }));
    print('Actual:', inspect(error.actual, { depth: 10, colors: true }));
    print('Operator:', error.operator);
    print(getFrames(error), '\n');
  });

  if (fails.length > 0) {
    print('Passed:', tests.length - fails.length);
    print('Failed:', fails.length, '\n');
    exit(1);
  }
}

export { test, assert, runTests };

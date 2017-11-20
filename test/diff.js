import { test, assert } from './test.js';
import { Element } from '../src/Element.js';
import { diff } from '../src/targets/diff.js';

function take(count, observable) {
  return new Promise((resolve, reject) => {
    observable.subscribe({
      start(s) {
        this.list = [];
        this.subscription = s;
      },
      next(n) {
        this.list.push(n);
        if (this.list.length === count) {
          resolve(this.list);
          this.subscription.unsubscribe();
        }
      },
      error(e) {
        reject(e);
      },
      complete() {
        resolve(this.list);
      },
    });
  });
}

test('diff - single element', () => {
  let elem = new Element('div', { a: 1, b: 2 }, [
    new Element('#text', { text: 'abc' }),
  ]);
  return take(1, diff(elem)).then(results => {
    assert.deepEqual(results[0].diff, ['create']);
    //assert.equal(results[0].tree.tag, 'div');
  });
});

test('diff - update props', () => {
  let updates = [
    new Element('div', { a: 1, b: 2 }),
    new Element('div', { b: 3, c: 4 }),
  ];
  return take(2, diff(updates)).then(results => {
    assert.deepEqual(results[0].diff, ['create', updates[0]]);
    assert.deepEqual(results[1].diff, [
      'setprop', updates[1], 'b',
      'setprop', updates[1], 'c',
      'removeprop', updates[1], 'a',
    ]);
  });
});

test('diff - replace node', () => {
  let updates = [
    new Element('div'),
    new Element('span'),
  ];
  return take(2, diff(updates)).then(results => {
    assert.deepEqual(results[0].diff, ['create', updates[0]]);
    assert.deepEqual(results[1].diff, ['replace', updates[0], updates[1]]);
  });
});

test('diff - children', () => {
  let updates = [
    new Element('div', {}, [
      new Element('div'),
      new Element('span'),
      new Element('img'),
    ]),
    new Element('div', {}, [
      new Element('span'),
      new Element('div'),
    ]),
  ];
  return take(2, diff(updates)).then(results => {
    assert.deepEqual(results[1].diff, [
      'movechild', updates[1], 1,
      'movechild', updates[1], 0,
      'removechild', updates[1], updates[0].children[2],
    ]);
  });
});

test('diff - nested', () => {
  let updates = [
    new Element('div', {}, [
      new Element('div', { a: 1, b: 2 }),
    ]),
    new Element('div', {}, [
      new Element('div', { a: 2, b: 3 }),
    ]),
  ];
  return take(2, diff(updates)).then(results => {
    assert.deepEqual(results[1].diff, [
      'setprop', updates[1].children[0], 'a',
      'setprop', updates[1].children[0], 'b',
    ]);
  });
});

import { test, assert } from './test.js';
import { Store } from '../src/Store.js';
import * as symbols from '../src/symbols.js';

test('new Store()', () => {
  let state = new Store().getState();
  assert.deepEqual(state, {});
  assert.equal(Object.getPrototypeOf(state), null);
});

test('new Store(data)', () => {
  let s = new Store({ a: 1, b: 2 });
  assert.deepEqual(s.getState(), { a: 1, b: 2 });
});

test('store.getState()', () => {
  assert.deepEqual(new Store({ a: 1, b: 2 }).getState(), { a: 1, b: 2 });
});

test('store.getState(fn)', () => {
  let s = new Store({ a: 1, b: 2 });
  let t = s.getState(data => [data.a, data.b]);
  assert.deepEqual(t, [1, 2]);
});

test('store.getState(null)', () => {
  assert.deepEqual(new Store({ a: 1, b: 2 }).getState(null), { a: 1, b: 2 });
});

test('store.subscribe(fn)', () => {
  let s = new Store({ a: 1, b: 2 });
  let nextArgs = [];
  let next = (value => nextArgs.push(value));

  // Current value is sent on subscribe
  let sub = s.subscribe(next);
  assert.deepEqual(nextArgs[0], { a: 1, b: 2 });

  // Value is sent after update
  s.setState({ a: 2 });
  assert.deepEqual(nextArgs[1], { a: 2, b: 2 });

  // Value is not sent after unsubscribe
  sub.unsubscribe();
  s.setState({ a: 1 });
  assert.equal(nextArgs.length, 2);
});

test('store.setState(null)', () => {
  let s = new Store();
  let calls = [];
  s.subscribe(value => calls.push(value));
  s.setState(null);
  assert.deepEqual(s.getState(), {});
  assert.equal(calls.length, 1);
});

test('store.setState(undefined)', () => {
  let s = new Store();
  let calls = [];
  s.subscribe(value => calls.push(value));
  s.setState(undefined);
  assert.deepEqual(s.getState(), {});
  assert.equal(calls.length, 1);
});

test('store.setState(data)', () => {
  let s = new Store();
  let calls = [];
  s.subscribe(value => calls.push(value));

  // setState updates the store if shallow change
  s.setState({ a: 1 });
  assert.deepEqual(s.getState(), { a: 1 });
  assert.deepEqual(calls[1], { a: 1 });

  // setState does not update store if no change
  s.setState({ a: 1 });
  assert.equal(calls.length, 2);

  // setState updates the store if identical objects
  let obj = {};
  s.setState({ obj });
  calls.length = 0;
  s.setState({ obj });
  assert.equal(calls.length, 1);
});

test('store.setState(fn)', () => {
  let s = new Store({ a: 1, b: 2 });
  s.setState(data => ({ a: data.a + 1, b: data.b + 1 }));
  assert.deepEqual(s.getState(), { a: 2, b: 3 });
});

test('store[symbol.observable]()', () => {
  let s = new Store({ a: 1, b: 2 });
  let observable = s[symbols.observable]();
  let value = null;
  let sub = observable.subscribe({
    next(v) { value = v; },
  });
  assert.deepEqual(value, { a: 1, b: 2 });
  sub.unsubscribe();
});

test('store.start', () => {
  let s = new Store();
  let calls = [];
  s.start = (...a) => calls.push(a);
  let sub1 = s.subscribe(() => {});
  assert.deepEqual(calls, [[]]);
  let sub2 = s.subscribe(() => {});
  assert.equal(calls.length, 1);
  sub1.unsubscribe();
  sub2.unsubscribe();
  s.subscribe(() => {});
  assert.equal(calls.length, 2);
});

test('store.pause()', () => {
  let s = new Store();
  let calls = [];
  s.pause = (...a) => calls.push(a);
  let sub1 = s.subscribe(() => {});
  let sub2 = s.subscribe(() => {});
  sub1.unsubscribe();
  assert.equal(calls.length, 0);
  sub2.unsubscribe();
  assert.deepEqual(calls, [[]]);
});

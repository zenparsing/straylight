import { test, assert } from './test.js';
import { UI } from '../src/UI.js';
import * as symbols from '../src/symbols.js';

test('new UI()', () => {
  let ui = new UI();
  assert.deepEqual(ui.getState(), {});
});

test('ui[symbols.observable]()', () => {
  let ui = new UI();
  let calls = [];
  ui.render = (props => props.x + ':test');
  let sub = ui[symbols.observable]().subscribe(v => calls.push(v));

  // UI update is pushed on subscribe
  assert.equal(calls.length, 1);
  assert.equal(typeof calls[0][symbols.element], 'function');
  assert.deepEqual(calls[0][symbols.element](), {
    tag: '#text',
    props: { text: 'undefined:test', children: [] },
    children: [],
  });

  // UI update is pushed on state change
  ui.setState({ x: 1 });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1][symbols.element](), {
    tag: '#text',
    props: { text: '1:test', children: [] },
    children: [],
  });

  // UI update is not pushed after unsubscribe
  sub.unsubscribe();
  ui.setState({ x: 2 });
  assert.equal(calls.length, 2);
});

test('ui.getContext()', () => {
  let ui = new UI();
  assert.deepEqual(ui.getContext(), {});
  ui.setContext({ a: 1, b: 2 });
  assert.deepEqual(ui.getContext(), { a: 1, b: 2 });
  ui.setState({ parentContext: { c: 3 } });
  assert.deepEqual(ui.getContext(), { a: 1, b: 2 });
  assert.equal(ui.getContext().c, 3);
  ui.setContext(null);
  assert.deepEqual(ui.getContext(), {});
  assert.equal(ui.getContext().c, 3);
});

test('ui.setContext(context)', () => {
  let ui = new UI();
  ui.setContext({ a: 1, b: 2 });
  assert.deepEqual(ui.getContext(), { a: 1, b: 2 });
  ui.setContext(null);
  assert.deepEqual(ui.getContext(), {});
});

test('ui.render(props, context)', () => {
  assert.throws(() => { new UI().render(); });
});

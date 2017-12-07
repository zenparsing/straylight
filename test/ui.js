import { test, assert } from './test.js';
import { UI } from '../src/UI.js';
import { Element } from '../src/Element.js';
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
    props: { value: 'undefined:test' },
    children: [],
  });

  // UI update is pushed on state change
  ui.setState({ x: 1 });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1][symbols.element](), {
    tag: '#text',
    props: { value: '1:test' },
    children: [],
  });

  // UI update is not pushed after unsubscribe
  sub.unsubscribe();
  ui.setState({ x: 2 });
  assert.equal(calls.length, 2);
});

test('ui.getState()', () => {
  let ui = new UI();
  assert.deepEqual(ui.getState(), {});
  ui.setState({ a: 1, b: 2 });
  assert.deepEqual(ui.getState(), { a: 1, b: 2 });
});

test('ui.getState(fn)', () => {
  let ui = new UI();
  ui.setState({ a: 1, b: 2 });
  assert.equal(ui.getState(s => s.a), 1);
});

test('ui.setState(data)', () => {
  let ui = new UI();
  ui.setState({ a: 1, b: 2 });
  assert.deepEqual(ui.getState(), { a: 1, b: 2 });
  ui.setState(null);
  assert.deepEqual(ui.getState(), { a: 1, b: 2 });
  ui.setState(undefined);
  assert.deepEqual(ui.getState(), { a: 1, b: 2 });
});

test('ui.setState(fn)', () => {
  let ui = new UI();
  ui.setState({ a: 1, b: 2 });
  ui.setState(s => ({ a: s.a + 1, b: s.b + 1 }));
  assert.deepEqual(ui.getState(), { a: 2, b: 3 });
  ui.setState(() => null);
  assert.deepEqual(ui.getState(), { a: 2, b: 3 });
  ui.setState(() => undefined);
  assert.deepEqual(ui.getState(), { a: 2, b: 3 });
});

test('ui.renderState()', () => {
  let ui = new UI();
  let args;
  let nested;

  function nestedRender(props, children) {
    nested = { props, children };
    return new Element('span');
  }

  ui.setState({ a: 1, b: 2 });

  ui.render = function(props, children) {
    args = { thisValue: this, props, children };
    return new Element('div', {}, [
      new Element(nestedRender, { x: 1 }),
      'text',
    ]);
  };

  assert.deepEqual(ui.renderState(), new Element('div', {}, [
    new Element('span'),
    new Element('#text', { value: 'text' }),
  ]));

  assert.equal(args.thisValue, ui);
  assert.deepEqual(args.props, { a: 1, b: 2 });
  assert.deepEqual(args.children, []);

  assert.deepEqual(nested.props, { x: 1 });
  assert.deepEqual(nested.children, []);
});

test('ui.start()', () => {
  let ui = new UI();
  let calls = [];

  assert.equal(ui.start(), undefined);
  ui.start = function() { calls.push(Array.from(arguments)); };

  let s1 = ui[symbols.observable]().subscribe(() => {});
  assert.equal(calls.length, 1);
  assert.deepEqual(calls, [[]]);
  let s2 = ui[symbols.observable]().subscribe(() => {});
  assert.equal(calls.length, 1);
  s1.unsubscribe();
  s2.unsubscribe();
  ui[symbols.observable]().subscribe(() => {});
  assert.equal(calls.length, 2);
});

test('ui.pause()', () => {
  let ui = new UI();
  let calls = [];

  assert.equal(ui.pause(), undefined);
  ui.pause = function() { calls.push(Array.from(arguments)); };

  let s1 = ui[symbols.observable]().subscribe(() => {});
  let s2 = ui[symbols.observable]().subscribe(() => {});
  assert.equal(calls.length, 0);
  s1.unsubscribe();
  assert.equal(calls.length, 0);
  s2.unsubscribe();
  assert.deepEqual(calls, [[]]);
});

test('ui.render(props, children, context)', () => {
  assert.throws(() => { new UI().render(); });
});

test('UI[symbols.render](props, children)', () => {
  let mock = {
    mapPropsToState(props, children) {
      this._props = Object.assign({}, props);
      this._children = children;
      return props;
    },
  };

  let tree = UI[symbols.render].call(mock,
    { id: 'x', a: 1, b: 2 },
    [],
  );

  assert.equal(tree.tag, '#document-fragment');
  assert.equal(tree.props.type, mock);
  assert.deepEqual(tree.props.state, { id: 'x', a: 1, b: 2 });
  assert.deepEqual(tree.children, []);

  assert.deepEqual(mock._props, { id: 'x', a: 1, b: 2 });
  assert.deepEqual(mock._children, []);
});

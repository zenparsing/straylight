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

  function nestedRender(props, context) {
    nested = { props, context };
    return new Element('span');
  }

  ui.setState({ a: 1, b: 2 });
  ui.setContext({ c: 3, d: 4 });

  ui.render = function(props, context) {
    args = { thisValue: this, props, context };
    return new Element('div', {}, [
      new Element(nestedRender, { x: 1 }),
      'text',
    ]);
  };

  assert.deepEqual(ui.renderState(), new Element('div', {}, [
    new Element('span'),
    new Element('#text', { text: 'text' }),
  ]));

  assert.equal(args.thisValue, ui);
  assert.deepEqual(args.props, { a: 1, b: 2 });
  assert.deepEqual(args.context, { c: 3, d: 4 });

  assert.deepEqual(nested.props, { x: 1, children: [] });
  assert.deepEqual(nested.context, { c: 3, d: 4 });
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

test('ui.render(props, context)', () => {
  assert.throws(() => { new UI().render(); });
});

test('UI.mapPropsToState', () => {
  let props = { a: 1, b: 2 };
  assert.equal(UI.mapPropsToState(props), props);
});

test('UI.tagName', () => {
  let desc = Object.getOwnPropertyDescriptor(UI, 'tagName');
  let obj = {};
  Object.defineProperty(obj, 'tagName', desc);
  assert.equal(obj.tagName, 'ui-x');
  obj.name = 'UI';
  assert.equal(obj.tagName, 'ui-x');
  obj.name = 'Widget';
  assert.equal(obj.tagName, 'ui-widget');
});

test('UI[symbols.mapStateToContent](states)', () => {
  let callback;
  let ui = UI[symbols.mapStateToContent]({ subscribe(fn) { callback = fn; } });
  assert.equal(ui.constructor, UI);
  callback({ a: 1, b: 2 });
  assert.deepEqual(ui.getState(), { a: 1, b: 2 });
  callback({ a: 3, c: 4 });
  assert.deepEqual(ui.getState(), { a: 3, b: 2, c: 4 });

  function ctor() {}
  let instance = UI[symbols.mapStateToContent].call(ctor, { subscribe() {} });
  assert.equal(instance.constructor, ctor);
});

test('UI[symbols.render](props, context)', () => {
  let mock = {
    tagName: 'ui-mock',
    mapPropsToState(props, context) {
      this._props = props;
      this._context = context;
      return props;
    },
  };

  let tree = UI[symbols.render].call(mock,
    { key: 'k', a: 1, b: 2 },
    { c: 3, d: 4 }
  );

  assert.deepEqual(tree, new Element('ui-mock', {
    key: 'k',
    contentManager: mock,
    contentManagerState: {
      key: 'k',
      a: 1,
      b: 2,
      parentContext: { c: 3, d: 4 },
    },
  }));

  assert.deepEqual(mock._props, { key: 'k', a: 1, b: 2 });
  assert.deepEqual(mock._context, { c: 3, d: 4 });
});

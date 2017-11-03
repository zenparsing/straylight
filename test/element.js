import { test, assert } from './test.js';
import { Element } from '../src/Element.js';
import * as symbols from '../src/symbols.js';

test('new Element(string)', () => {
  let e = new Element('div');
  assert.equal(e.tag, 'div');
  assert.deepEqual(e.children, []);
  assert.deepEqual(e.props, { children: [] });
});

test('new Element(function)', () => {
  let fn = () => {};
  let e = new Element(fn);
  assert.equal(e.tag, fn);
});

test('new Element(tag, props)', () => {
  let p = { a: 1, b: 2 };
  let e = new Element('div', p);
  assert.deepEqual(e.props, { a: 1, b: 2, children: [] });
  assert.ok(e.props !== p);
});

test('new Element(tag, props, children)', () => {
  let e = new Element('div', { a: 1, b: 2 }, [new Element('span')]);
  assert.deepEqual(e.props, { a: 1, b: 2, children: [new Element('span')] });
  assert.equal(e.props.children, e.children);
});

test('new Element(tag, { children })', () => {
  let e = new Element('div', { children: [new Element('span')] });
  assert.deepEqual(e.children, [new Element('span')]);
});

test('new Element(tag, { children }, [])', () => {
  // Children prop takes precedence over empty children argument
  let e = new Element('div', { children: [new Element('span')] }, []);
  assert.deepEqual(e.children, [new Element('span')]);
});

test('new Element(tag, { children }, [elem])', () => {
  // Non-empty children argument takes precedence over children property
  let e = new Element('div',
    { children: [new Element('span')] },
    [new Element('x')]);
  assert.deepEqual(e.children, [new Element('x')]);
});

test('element[symbols.element]()', () => {
  let e = new Element('div');
  assert.equal(e[symbols.element](), e);
});

test('Element.from(null)', () => {
  assert.deepEqual(Element.from(null), new Element('#text', { text: '' }));
});

test('Element.from(undefined)', () => {
  assert.deepEqual(Element.from(null), new Element('#text', { text: '' }));
});

test('Element.from(string)', () => {
  assert.deepEqual(Element.from('x'), new Element('#text', { text: 'x' }));
});

test('Element.from(number)', () => {
  assert.deepEqual(Element.from(1), new Element('#text', { text: '1' }));
});

test('Element.from(boolean)', () => {
  assert.deepEqual(Element.from(true), new Element('#text', { text: 'true' }));
});

test('Element.from(array)', () => {
  assert.deepEqual(
    Element.from([1, 'a', new Element('div')]),
    new Element('#document-fragment', {}, [
      Element.from(1),
      Element.from('a'),
      new Element('div'),
    ])
  );
});

test('Element.from(elementLike)', () => {
  let like = {
    [symbols.element]() {
      return new Element('x');
    },
  };
  assert.deepEqual(Element.from(like), new Element('x'));
});

test('Element.from(invalid)', () => {
  assert.throws(() => Element.from({}));
});

test('Element.evaluate: A new object is returned', () => {
  let a = new Element('div');
  let b = Element.evaluate(a);
  assert.notEqual(a, b);
});

test('element.evaluate: Render function tag', () => {
  function render(props, context) {
    return new Element('div', { props, context });
  }

  let c = { x: 1, y: 2 };
  let p = { a: 1, b: 2 };
  let e = Element.evaluate(new Element(render, p), c);

  assert.deepEqual(e, new Element('div', {
    props: { a: 1, b: 2, children: [] },
    context: c,
  }));
});

test('element.evaluate: Renderable tag', () => {
  let renderable = {
    [symbols.render](props, context) {
      return new Element('div', {
        receiver: this,
        props,
        context,
      });
    },
  };

  let c = { x: 1, y: 2 };
  let p = { a: 1, b: 2 };
  let e = Element.evaluate(new Element(renderable, p), c);

  assert.deepEqual(e, new Element('div', {
    props: { a: 1, b: 2, children: [] },
    receiver: renderable,
    context: c,
  }));
});

test('element.evaluate: invalid tag', () => {
  assert.throws(() => {
    Element.evaluate(new Element(1));
  });
});

test('element.evaluate: key is propagated', () => {
  function renderA() { return new Element('div'); }
  function renderB() { return new Element('div', { key: 'y' }); }

  let a = Element.evaluate(new Element(renderA, { key: 'x' }));
  assert.equal(a.props.key, 'x');

  let b = Element.evaluate(new Element(renderB, { key: 'x' }));
  assert.equal(b.props.key, 'y');
});

test('element.evaluate: children are evaluated', () => {
  function render(props, context) {
    return new Element('div', { props, context });
  }

  let e = Element.evaluate(
    new Element('div', {}, [new Element(render, { a: 1, b: 2 })]),
    { x: 'a', y: 'b' }
  );

  assert.deepEqual(e.children[0], new Element('div', {
    props: { a: 1, b: 2, children: [] },
    context: { x: 'a', y: 'b' },
  }));
});

test('element.evaluate: recursive rendering', () => {
  function renderA() { return new Element(renderB, { a: 1, b: 2 }); }
  function renderB(props, context) { return new Element('div', { props, context }); }

  let e = Element.evaluate(new Element(renderA), { x: 'a', y: 'b' });

  assert.deepEqual(e, new Element('div', {
    props: { a: 1, b: 2, children: [] },
    context: { x: 'a', y: 'b' },
  }));
});

test('element.evaluate: element sources', () => {
  assert.deepEqual(Element.evaluate(null), Element.from(null));
  assert.deepEqual(Element.evaluate(undefined), Element.from(undefined));
  assert.deepEqual(Element.evaluate('x'), Element.from('x'));
  assert.deepEqual(Element.evaluate(1), Element.from(1));
  assert.deepEqual(Element.evaluate(true), Element.from(true));
  assert.deepEqual(Element.evaluate([1]), Element.from([1]));
});

import { test, assert } from './test.js';
import { Element } from '../src/Element.js';
import * as symbols from '../src/symbols.js';

test('new Element(string)', () => {
  let e = new Element('div');
  assert.equal(e.tag, 'div');
  assert.deepEqual(e.children, []);
  assert.deepEqual(e.props, {});
});

test('new Element(function)', () => {
  let fn = () => {};
  let e = new Element(fn);
  assert.equal(e.tag, fn);
});

test('new Element(tag, props)', () => {
  let p = { a: 1, b: 2 };
  let e = new Element('div', p);
  assert.deepEqual(e.props, { a: 1, b: 2 });
});

test('new Element(tag, props, children)', () => {
  let e = new Element('div', { a: 1, b: 2 }, [new Element('span')]);
  assert.deepEqual(e.props, { a: 1, b: 2 });
  assert.deepEqual(e.children, [{
    tag: 'span',
    props: {},
    children: [],
  }]);
});

test('element[symbols.element]()', () => {
  let e = new Element('div');
  assert.equal(e[symbols.element](), e);
});

test('Element.from(null)', () => {
  assert.deepEqual(Element.from(null), new Element('#text', { value: '' }));
});

test('Element.from(undefined)', () => {
  assert.deepEqual(Element.from(null), new Element('#text', { value: '' }));
});

test('Element.from(string)', () => {
  assert.deepEqual(Element.from('x'), new Element('#text', { value: 'x' }));
});

test('Element.from(number)', () => {
  assert.deepEqual(Element.from(1), new Element('#text', { value: '1' }));
});

test('Element.from(boolean)', () => {
  assert.deepEqual(Element.from(true), new Element('#text', { value: 'true' }));
});

test('Element.from(array)', () => {
  assert.deepEqual(
    Element.from([1, 'a', new Element('div')]),
    new Element('#document-fragment', {}, [1, 'a', new Element('div')])
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

test('Element.evaluate: Render function tag', () => {
  function render(props, children) {
    return new Element('div', { props, children });
  }

  let p = { a: 1, b: 2 };
  let e = Element.evaluate(new Element(render, p));

  assert.deepEqual(e, new Element('div', {
    props: { a: 1, b: 2 },
    children: [],
  }));
});

test('Element.evaluate: Renderable tag', () => {
  let renderable = {
    [symbols.render](props, children) {
      return new Element('div', {
        receiver: this,
        props,
        children,
      });
    },
  };

  let p = { a: 1, b: 2 };
  let e = Element.evaluate(new Element(renderable, p));

  assert.deepEqual(e, new Element('div', {
    props: { a: 1, b: 2 },
    receiver: renderable,
    children: [],
  }));
});

test('Element.evaluate: invalid tag', () => {
  assert.throws(() => {
    Element.evaluate(new Element(1));
  });
});

test('Element.evaluate: children are evaluated', () => {
  function render(props, children) {
    return new Element('div', { props, children });
  }

  let e = Element.evaluate(
    new Element('div', {}, [new Element(render, { a: 1, b: 2 })])
  );

  assert.deepEqual(e.children[0], new Element('div', {
    props: { a: 1, b: 2 },
    children: [],
  }));
});

test('Element.evaluate: recursive rendering', () => {
  function renderA() {
    return new Element(renderB, { a: 1, b: 2 });
  }

  function renderB(props, children) {
    return new Element('div', { props, children });
  }

  let e = Element.evaluate(new Element(renderA));

  assert.deepEqual(e, new Element('div', {
    props: { a: 1, b: 2 },
    children: [],
  }));
});

test('Element.evaluate: element sources', () => {
  assert.deepEqual(Element.evaluate(null), Element.from(null));
  assert.deepEqual(Element.evaluate(undefined), Element.from(undefined));
  assert.deepEqual(Element.evaluate('x'), Element.from('x'));
  assert.deepEqual(Element.evaluate(1), Element.from(1));
  assert.deepEqual(Element.evaluate(true), Element.from(true));
  assert.deepEqual(Element.evaluate([1]),
    new Element('#document-fragment', {}, [
      new Element('#text', { value: '1' }),
    ])
  );
});

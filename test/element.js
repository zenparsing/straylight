import assert from 'assert';
import { Element } from '../src/Element.js';

{ // new Element(string)
  let e = new Element('div');
  assert.equal(e.tag, 'div');
  assert.deepEqual(e.children, []);
  assert.deepEqual(e.props, { children: [] });
}

{ // new Element(function)
  let fn = () => {};
  let e = new Element(fn);
  assert.equal(e.tag, fn);
}

{ // new Element(tag, props)
  let p = { a: 1, b: 2 };
  let e = new Element('div', p);
  assert.deepEqual(e.props, { a: 1, b: 2, children: [] });
  assert.ok(e.props !== p);
}

{ // new Element(tag, props, children)
  let e = new Element('div', { a: 1, b: 2 }, [new Element('span')]);
  assert.deepEqual(e.props, { a: 1, b: 2, children: [new Element('span')] });
  assert.equal(e.props.children, e.children);
}

{ // new Element(tag, { children })
  let e = new Element('div', { children: [new Element('span')] });
  assert.deepEqual(e.children, [new Element('span')]);
}

{ // new Element(tag, { children }, [])
  // Children prop takes precedence over empty children argument
  let e = new Element('div', { children: [new Element('span')] }, []);
  assert.deepEqual(e.children, [new Element('span')]);
}

{ // new Element(tag, { children }, [elem])
  // Non-empty children argument takes precedence over children property
  let e = new Element('div', { children: [new Element('span')] }, [
    new Element('x'),
  ]);
  assert.deepEqual(e.children, [new Element('x')]);
}

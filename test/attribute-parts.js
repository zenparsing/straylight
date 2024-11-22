import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { AsyncIterationBuffer } from 'async-iteration-buffer';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/vdom.js';

describe('Attribute part updaters', () => {
  let document = createDocument();

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.firstElementChild.toDataObject().attributes;
    assert.deepStrictEqual(actual, expected);
  }

  it('concatenates strings', () => {
    assertResult(html`<div x='a${'b'}c' />`, {
      x: 'abc',
    });
  });

  it('joins array values with spaces', () => {
    assertResult(html`<div x='a ${['b', 'c']} d' />`, {
      x: 'a b c d',
    });
  });

  it('joins iterable values with spaces', () => {
    function* g() { yield 'b'; yield 'c'; }
    assertResult(html`<div x='a ${g()} d' />`, {
      x: 'a b c d',
    });
  });

  it('does not update until pending values are available', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, html`<div x='a${'b'}${buffer}d' />`);
    let div = target.firstElementChild;
    await null;
    assert.deepStrictEqual(div.toDataObject().attributes, {});
    await buffer.next('c');
    assert.deepStrictEqual(div.toDataObject().attributes, { x: 'abcd' });
    await buffer.next('C');
    assert.deepStrictEqual(div.toDataObject().attributes, { x: 'abCd' });
  });

  it('sets property values for existing property names', () => {
    let target = document.createElement('div');
    applyTemplate(target, html`<div className='a ${['b', 'c']} d' />`);
    let elem = target.firstElementChild;
    assert.equal(elem.className, 'a b c d');
  });

});

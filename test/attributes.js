import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/extras/vdom.js';

describe('Attribute updaters', () => {
  let document = createDocument();
  let render = val => html`<div x=${val} />`;

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.firstElementChild.toDataObject().attributes;
    assert.deepStrictEqual(actual, expected);
  }

  it('assigns attribute values', () => {
    assertResult(render(1), { x: '1' });
  });

  it('assigns consecutive identical values', () => {
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    applyTemplate(target, render('a'));
    assert.strictEqual(target.firstElementChild.getAttribute('x'), 'a');
  });

  it('removes attributes whose value is undefined', () => {
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    let elem = target.firstElementChild;
    assert.strictEqual(elem.getAttribute('x'), 'a');
    applyTemplate(target, render(undefined));
    assert.ok(!elem.hasAttribute('x'));
  });

  it('removes attributes whose value is false', () => {
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    let elem = target.firstElementChild;
    assert.strictEqual(elem.getAttribute('x'), 'a');
    applyTemplate(target, render(false));
    assert.ok(!elem.hasAttribute('x'));
  });

  it('uses the attribute name for boolean attribute values', () => {
    assertResult(render(true), { x: 'x' });
  });

  it('joins array values with spaces', () => {
    assertResult(render(['a', 'b']), { x: 'a b' });
  });

  it('joins iterable values with spaces', () => {
    function* g() { yield 'a'; yield 'b'; }
    assertResult(render(g()), { x: 'a b' });
  });

});

import assert from 'assert';
import { html, applyTemplate } from '../src';
import { createDocument } from '../src/extras/vdom.js';

describe('Attribute map updaters', () => {
  let document = createDocument();

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.firstElementChild.toDataObject().attributes;
    assert.deepEqual(actual, expected);
  }

  it('assigns object keys', () => {
    assertResult(html`<div ${{ x: '1', y: '2' }} />`, {
      x: '1',
      y: '2',
    });
  });

  it('joins array values with spaces', () => {
    assertResult(html`<div ${{ x: ['a', 'b'] }} />`, {
      x: 'a b',
    });
  });

  it('throws if the value is a function', () => {
    assert.throws(() => {
      function f() {}
      applyTemplate(document.createElement('div'), html`<div ${f} />`);
    });
  });

});

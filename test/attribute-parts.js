import assert from 'assert';
import { html, applyTemplate } from '../src';
import { Document } from '../src/extras/vdom.js';
import AsyncIterationBuffer from 'async-iteration-buffer';

describe('Attribute part updaters', () => {
  let document = new Document();

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.firstElementChild.toDataObject().attributes;
    assert.deepEqual(actual, expected);
  }

  it('concatenates strings', () => {
    assertResult(html`<div x='a${'b'}c' />`, {
      x: 'abc',
    });
  });

  it('does not update until pending values are available', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, html`<div x='a${'b'}${buffer}d' />`);
    let div = target.firstElementChild;
    await null;
    assert.deepEqual(div.toDataObject().attributes, {});
    await buffer.next('c');
    assert.deepEqual(div.toDataObject().attributes, { x: 'abcd' });
    await buffer.next('C');
    assert.deepEqual(div.toDataObject().attributes, { x: 'abCd' });
  });

});

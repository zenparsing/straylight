import assert from 'assert';
import { html, applyTemplate } from '../src';
import { Document } from '../src/extras/vdom.js';

describe('Attribute map updaters', () => {
  let document = new Document();

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

});

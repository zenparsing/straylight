import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';

describe('Attribute map updaters', () => {
  let document = new vdom.Document();

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

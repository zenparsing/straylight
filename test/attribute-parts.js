import assert from 'assert';
import { html, applyTemplate } from '../src';
import { Document } from '../src/extras/vdom.js';
import { createPushStream } from './observable.js';

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

  it('does not update until pending values are available', () => {
    let stream = createPushStream();
    let target = document.createElement('div');
    applyTemplate(target, html`<div x='a${'b'}${stream}d' />`);
    let div = target.firstElementChild;
    assert.deepEqual(div.toDataObject().attributes, {});
    stream.next('c');
    assert.deepEqual(div.toDataObject().attributes, { x: 'abcd' });
    stream.next('C');
    assert.deepEqual(div.toDataObject().attributes, { x: 'abCd' });
  });

});

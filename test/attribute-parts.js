const { html, applyTemplate } = require('../');
const { vdom } = require('../extras');
const assert = require('assert');

describe('Attribute part updaters', () => {
  let document = new vdom.Document();

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.childNodes[0].toDataObject().attributes;
    assert.deepEqual(actual, expected);
  }

  it('concatenates strings', () => {
    assertResult(html`<div x='a${'b'}c' />`, {
      x: 'abc',
    });
  });

});

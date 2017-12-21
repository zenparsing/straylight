const { html, applyTemplate } = require('../');
const assert = require('assert');
const Observable = require('zen-observable');
const { Document } = require('./mocks');

describe('Observables', () => {
  let document = new Document();

  it('should correctly replace a template value with null', () => {
    let target = document.createElement('div');
    let observable = Observable.of(html`<span>a</span><span>b</span>`, null);
    applyTemplate(target, html`${ observable }`);
    assert.deepEqual(target.toDataObject(), {
      nodeName: 'div',
      attributes: {},
      childNodes: ['', ''],
    });
  });

});

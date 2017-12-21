const { html, applyTemplate } = require('../');
const assert = require('assert');
const { Document } = require('./mocks');

describe('Child updaters', () => {
  let document = new Document();

  function assertResult(template, data) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    assert.deepEqual(target.toDataObject().childNodes, data);
  }

  it('can contain null values', () => {
    assertResult(html`${ null }`, ['', '']);
  });

  it('can contain string values', () => {
    assertResult(html`${ 'text' }`, ['text', '']);
  });

  it('can contain number values', () => {
    assertResult(html`${ 1 }`, ['1', '']);
  });

  it('can contain boolean values', () => {
    assertResult(html`${ true }`, ['true', '']);
  });

  it('can contain template values', () => {
    assertResult(html`${ html`<span>text</span>` }`, [
      {
        nodeName: 'span',
        attributes: {},
        childNodes: ['text'],
      },
      '',
    ]);
  });

  it('can contain array values', () => {
    let array = [null, 'foo', html`<span>text</span>`];
    assertResult(html`${ array }`, [
      '',
      'foo',
      {
        nodeName: 'span',
        attributes: {},
        childNodes: ['text'],
      },
      '',
    ]);
  });

});

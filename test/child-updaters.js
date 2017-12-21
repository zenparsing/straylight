const { html, applyTemplate } = require('../');
const assert = require('assert');
const Observable = require('zen-observable');
const { Document } = require('./mocks');

Observable.extensions.setHostReportError(err => { throw err; });

describe('Child updaters', () => {
  let document = new Document();

  function assertResult(content, data) {
    let target = document.createElement('div');
    applyTemplate(target, html`${content}`);
    assert.deepEqual(target.toDataObject().childNodes, data);
  }

  describe('single updates', () => {
    it('null values', () => {
      assertResult(null, ['', '']);
    });

    it('string values', () => {
      assertResult('text', ['text', '']);
    });

    it('number values', () => {
      assertResult(1, ['1', '']);
    });

    it('boolean values', () => {
      assertResult(true, ['true', '']);
    });

    it('template values', () => {
      assertResult(html`<span>text</span>`, [
        {
          nodeName: 'span',
          attributes: {},
          childNodes: ['text'],
        },
        '',
      ]);
    });

    it('array values', () => {
      assertResult([null, 'foo', html`<span>text</span>`], [
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

    it('iterables', () => {
      assertResult(new Set(['a', 'b', 'c']), ['a', 'b', 'c', '']);
    });
  });

  describe('multiple updates', () => {
    it('template with multiple children to text', () => {
      assertResult(
        Observable.of(html`<span>a</span><span>b</span>`, ''),
        ['', '']
      );
    });

    it('vector to scalar', () => {
      assertResult(
        Observable.of(
          ['a', html`<span>x</span>`, 'b'],
          'c'
        ), [
          'c',
          '',
        ]
      );
    });

    it('scalar to vector', () => {
      assertResult(
        Observable.of(
          'a',
          ['b', html`<span>x</span>`, 'c']
        ), [
          'b',
          {
            nodeName: 'span',
            attributes: {},
            childNodes: ['x'],
          },
          'c',
          '',
        ]
      );
    });
  });

});

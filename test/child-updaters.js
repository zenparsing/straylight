import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';
import { Observable, createPushStream } from './observable.js';

describe('Child updaters', () => {
  let document = new vdom.Document();

  function withDelay(...args) {
    return new Observable(sink => {
      function next() {
        if (args.length === 0) {
          sink.complete();
          return;
        }
        setTimeout(() => {
          sink.next(args.unshift());
          next();
        });
      }
      next();
    });
  }

  function assertResult(content, data) {
    let target = document.createElement('div');
    applyTemplate(target, html`${content}`);
    assert.deepEqual(target.toDataObject().childNodes, data);
  }

  describe('Single updates', () => {
    it('accepts null values', () => {
      assertResult(null, ['', '']);
    });

    it('accepts string values', () => {
      assertResult('text', ['text', '']);
    });

    it('accepts number values', () => {
      assertResult(1, ['1', '']);
    });

    it('accepts boolean values', () => {
      assertResult(true, ['true', '']);
    });

    it('accepts template values', () => {
      assertResult(html`<span>text</span>`, [
        {
          nodeName: 'span',
          attributes: {},
          childNodes: ['text'],
        },
        '',
      ]);
    });

    it('accepts array values', () => {
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

    it('accepts iterables', () => {
      assertResult(new Set(['a', 'b', 'c']), ['a', 'b', 'c', '']);
    });
  });

  describe('Multiple updates', () => {
    it('updates a template with multiple children to text', () => {
      assertResult(
        Observable.of(html`<span>a</span><span>b</span>`, ''),
        ['', '']
      );
    });

    it('updates from vector to scalar', () => {
      assertResult(
        Observable.of(
          ['a', html`<span>x</span>`, 'b'],
          'c'
        ), ['c', '']
      );
    });

    it('updates from scalar to vector', () => {
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

    it.skip('updates from empty template to text', () => {
      assertResult(
        Observable.of(html``, 'text'),
        ['text', ''],
      )
    });

    it('updates from template with dynamic first child to text', () => {
      assertResult(
        Observable.of(html`${'a'}${'b'}`, 'text'),
        ['text', ''],
      );
    });

    it('updates from template with changed content to text', () => {
      let render = val => html`${val}`;
      let target = document.createElement('div');
      let stream = createPushStream();
      applyTemplate(target, html`${stream}`);
      stream.next(render(html`<div>1</div>`));
      stream.next(render(html`<div>2</div>`));
      stream.next('text');
      assert.deepEqual(target.toDataObject().childNodes, [
        'text',
        '',
      ]);
    });

    it('swaps children', () => {
      let a = html`first`;
      let b = html`second`;
      assertResult(
        Observable.of([a, b], [b, a]),
        ['second', 'first', '']
      );
    });
  });

});

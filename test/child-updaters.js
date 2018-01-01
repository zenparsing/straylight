import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';
import { Observable, createPushStream } from './observable.js';

describe('Child updaters', () => {
  let document = new vdom.Document();

  function assertResult(content, data) {
    let target = document.createElement('div');
    applyTemplate(target, html`${content}`);
    assert.deepEqual(target.toDataObject().childNodes, data);
  }

  describe('Single updates', () => {
    it('accepts null values', () => {
      assertResult(null, []);
    });

    it('accepts string values', () => {
      assertResult('text', ['text']);
    });

    it('accepts number values', () => {
      assertResult(1, ['1']);
    });

    it('accepts boolean values', () => {
      assertResult(true, ['true']);
    });

    it('accepts template values', () => {
      assertResult(html`<span>text</span>`, [
        {
          nodeName: 'span',
          attributes: {},
          childNodes: ['text'],
        },
      ]);
    });

    it('accepts array values', () => {
      assertResult([null, 'foo', html`<span>text</span>`], [
        'foo',
        {
          nodeName: 'span',
          attributes: {},
          childNodes: ['text'],
        },
      ]);
    });

    it('accepts an empty array', () => {
      assertResult([], []);
    });

    it('accepts iterables', () => {
      assertResult(new Set(['a', 'b', 'c']), ['a', 'b', 'c']);
    });

    it('throws if child is not valid', () => {
      assert.throws(() => {
        applyTemplate(document.createElement('div'), html`${{}}`);
      });
    });
  });

  describe('Multiple updates', () => {
    it('updates a template with multiple children to text', () => {
      assertResult(
        Observable.of(html`<span>a</span><span>b</span>`, ''),
        []
      );
    });

    it('updates from text to null', () => {
      assertResult(
        Observable.of('a', null),
        [],
      );
    });

    it('updates from vector to scalar', () => {
      assertResult(
        Observable.of(
          ['a', html`<span>x</span>`, 'b'],
          'c'
        ), ['c']
      );
    });

    it('updates from empty vector to scalar', () => {
      assertResult(
        Observable.of([], 'text'),
        ['text']
      );
    });

    it('updates from a larger array to a smaller array', () => {
      assertResult(
        Observable.of(['a', 'b', 'c'], ['d', 'e']),
        ['d', 'e']
      );
    });

    it('updates from a larger array to a smaller array twice', () => {
      assertResult(
        Observable.of(['a', 'b', 'c'], ['d', 'e'], ['e', 'd']),
        ['e', 'd']
      );
    });

    it('updates from a smaller array to a larger array', () => {
      assertResult(
        Observable.of(['a', 'b'], ['c', 'd', 'e']),
        ['c', 'd', 'e']
      );
    });

    it('inserts slots at front of array', () => {
      assertResult(
        Observable.of(['a'], [html`b`, 'a']),
        ['b', 'a']
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
        ]
      );
    });

    it('updates from empty template to text', () => {
      assertResult(
        Observable.of(html``, 'text'),
        ['text'],
      );
    });

    it('updates from template with dynamic first child to text', () => {
      assertResult(
        Observable.of(html`${'a'}${'b'}`, 'text'),
        ['text'],
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
      assert.deepEqual(target.toDataObject().childNodes, ['text']);
    });

    it('swaps children', () => {
      let a = html`first`;
      let b = html`second`;
      assertResult(
        Observable.of([a, b], [b, a]),
        ['second', 'first']
      );
    });

    it('swaps several children', () => {
      let a = html`first`;
      let b = html`second`;
      let c = html`third`;
      assertResult(
        Observable.of([a, b, c], [c, b, a]),
        ['third', 'second', 'first']
      );
    });

    it('swaps children with multiple nodes', () => {
      let a = html`<div>a</div><div>b</div>`;
      let b = html`<div>c</div><div>d</div>`;
      assertResult(
        Observable.of([a, b], [b, a]),
        [
          { nodeName: 'div', attributes: {}, childNodes: ['c'] },
          { nodeName: 'div', attributes: {}, childNodes: ['d'] },
          { nodeName: 'div', attributes: {}, childNodes: ['a'] },
          { nodeName: 'div', attributes: {}, childNodes: ['b'] },
        ]
      );
    });

    it('does not set text value for repeated identical values', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, html`${stream}`);
      stream.next('');
      let textNode = target.childNodes[1];
      let assignedValues = [];
      Object.defineProperty(textNode, 'nodeValue', {
        set(value) { assignedValues.push(value); },
      });
      stream.next('a');
      stream.next('a');
      assert.deepEqual(assignedValues, ['a']);
    });
  });

  describe('Cancellation', () => {
    it('cancels slot updates for single values', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, html`${stream}`);
      assert.equal(stream.observers.size, 1);
      applyTemplate(target, html``);
      assert.equal(stream.observers.size, 0);
    });

    it('cancels slot updates for multiple values', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, html`${['a', html`${stream}`, 'b']}`);
      assert.equal(stream.observers.size, 1);
      applyTemplate(target, html``);
      assert.equal(stream.observers.size, 0);
    });

    it('cancels slot updates in nested templates', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, html`${html`${stream}`}`);
      assert.equal(stream.observers.size, 1);
      applyTemplate(target, html``);
      assert.equal(stream.observers.size, 0);
    });
  });

});

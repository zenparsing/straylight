import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { AsyncIterationBuffer } from 'async-iteration-buffer';
import { html, applyTemplate, createSlotSymbol } from '../src/index.js';
import { createDocument } from '../src/vdom.js';

function afterTasks() {
  return new Promise(r => setTimeout(r));
}

describe('Child updaters', () => {
  let document = createDocument();

  function assertResult(content, data) {
    let target = document.createElement('div');
    applyTemplate(target, html`${content}`);
    return afterTasks().then(() => {
      assert.deepStrictEqual(target.toDataObject().childNodes, data);
    });
  }

  describe('Single updates', () => {
    it('accepts null values', () => {
      return assertResult(null, []);
    });

    it('accepts string values', () => {
      return assertResult('text', ['text']);
    });

    it('accepts number values', () => {
      return assertResult(1, ['1']);
    });

    it('accepts boolean values', () => {
      return assertResult(true, ['true']);
    });

    it('accepts template values', () => {
      return assertResult(html`<span>text</span>`, [
        {
          nodeName: 'span',
          attributes: {},
          childNodes: ['text'],
        },
      ]);
    });

    it('accepts array values', () => {
      return assertResult([null, 'foo', html`<span>text</span>`], [
        'foo',
        {
          nodeName: 'span',
          attributes: {},
          childNodes: ['text'],
        },
      ]);
    });

    it('accepts an empty array', () => {
      return assertResult([], []);
    });

    it('accepts iterables', () => {
      return assertResult(new Set(['a', 'b', 'c']), ['a', 'b', 'c']);
    });

    it('throws if child is not valid', () => {
      assert.throws(() => {
        applyTemplate(document.createElement('div'), html`${{}}`);
      });
    });
  });

  describe('Multiple updates', () => {
    it('updates a template with multiple children to text', () => {
      return assertResult(
        AsyncIterationBuffer.of(html`<span>a</span><span>b</span>`, ''),
        []
      );
    });

    it('updates from text to null', () => {
      return assertResult(
        AsyncIterationBuffer.of('a', null),
        []
      );
    });

    it('updates from vector to scalar', () => {
      return assertResult(
        AsyncIterationBuffer.of(
          ['a', html`<span>x</span>`, 'b'],
          'c'
        ), ['c']
      );
    });

    it('updates from empty vector to scalar', () => {
      return assertResult(
        AsyncIterationBuffer.of([], 'text'),
        ['text']
      );
    });

    it('updates from a larger array to a smaller array', () => {
      return assertResult(
        AsyncIterationBuffer.of(['a', 'b', 'c'], ['d', 'e']),
        ['d', 'e']
      );
    });

    it('updates from a larger array to a smaller array twice', () => {
      return assertResult(
        AsyncIterationBuffer.of(['a', 'b', 'c'], ['d', 'e'], ['e', 'd']),
        ['e', 'd']
      );
    });

    it('updates from a smaller array to a larger array', () => {
      return assertResult(
        AsyncIterationBuffer.of(['a', 'b'], ['c', 'd', 'e']),
        ['c', 'd', 'e']
      );
    });

    it('inserts slots at front of array', () => {
      return assertResult(
        AsyncIterationBuffer.of(['a'], [html`b`, 'a']),
        ['b', 'a']
      );
    });

    it('updates from scalar to vector', () => {
      return assertResult(
        AsyncIterationBuffer.of(
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
      return assertResult(
        AsyncIterationBuffer.of(html``, 'text'),
        ['text']
      );
    });

    it('updates from template with dynamic first child to text', () => {
      return assertResult(
        AsyncIterationBuffer.of(html`${'a'}${'b'}`, 'text'),
        ['text']
      );
    });

    it('updates from template with changed content to text', async () => {
      let render = val => html`${val}`;
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, html`${buffer}`);
      buffer.next(render(html`<div>1</div>`));
      buffer.next(render(html`<div>2</div>`));
      buffer.next('text');
      await afterTasks();
      assert.deepStrictEqual(target.toDataObject().childNodes, ['text']);
    });

    it('swaps children', () => {
      let a = html`first`;
      let b = html`second`;
      return assertResult(
        AsyncIterationBuffer.of([a, b], [b, a]),
        ['second', 'first']
      );
    });

    it('swaps several children', () => {
      let a = html`first`;
      let b = html`second`;
      let c = html`third`;
      return assertResult(
        AsyncIterationBuffer.of([a, b, c], [c, b, a]),
        ['third', 'second', 'first']
      );
    });

    it('swaps children with multiple nodes', () => {
      let a = html`<div>a</div><div>b</div>`;
      let b = html`<div>c</div><div>d</div>`;
      return assertResult(
        AsyncIterationBuffer.of([a, b], [b, a]),
        [
          { nodeName: 'div', attributes: {}, childNodes: ['c'] },
          { nodeName: 'div', attributes: {}, childNodes: ['d'] },
          { nodeName: 'div', attributes: {}, childNodes: ['a'] },
          { nodeName: 'div', attributes: {}, childNodes: ['b'] },
        ]
      );
    });

    it('does not set text value for repeated identical values', async () => {
      let buffer = new AsyncIterationBuffer();
      let target = document.createElement('div');
      applyTemplate(target, html`${buffer}`);
      buffer.next('');
      await afterTasks();
      let textNode = target.firstChild.nextSibling;
      let assignedValues = [];
      Object.defineProperty(textNode, 'nodeValue', {
        set(value) { assignedValues.push(value); },
      });
      buffer.next('a');
      buffer.next('a');
      await afterTasks();
      assert.deepStrictEqual(assignedValues, ['a']);
    });
  });

  describe('Cancellation', () => {
    it('cancels slot updates for single values', () => {
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      let target = document.createElement('div');
      applyTemplate(target, html`${buffer}`);
      assert.strictEqual(cancelled, false);
      applyTemplate(target, html``);
      assert.strictEqual(cancelled, true);
    });

    it('cancels slot updates for multiple values', () => {
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      let target = document.createElement('div');
      applyTemplate(target, html`${['a', html`${buffer}`, 'b']}`);
      assert.strictEqual(cancelled, false);
      applyTemplate(target, html``);
      assert.strictEqual(cancelled, true);
    });

    it('cancels slot updates in nested templates', () => {
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      let target = document.createElement('div');
      applyTemplate(target, html`${html`${buffer}`}`);
      assert.strictEqual(cancelled, false);
      applyTemplate(target, html``);
      assert.strictEqual(cancelled, true);
    });
  });

  describe('Custom slot types', () => {
    it('creates a slot using value.createSlot', () => {
      assert.strictEqual(typeof createSlotSymbol, 'symbol');

      class CustomSlotValue {
        constructor(value) {
          this.value = value;
        }

        [createSlotSymbol](context, parent, next) {
          return new CustomSlot(context, parent, next, this);
        }
      }

      class CustomSlot {
        constructor(context, parent, next, wrapped) {
          this.context = context;
          this.start = document.createTextNode('start');
          this.end = document.createTextNode('end');
          parent.insertBefore(this.start, next);
          parent.insertBefore(document.createTextNode(wrapped.value), next);
          parent.insertBefore(this.end, next);
        }

        cancelUpdates() {
          // Empty
        }

        match(value) {
          return value instanceof CustomSlotValue;
        }

        update(wrapped) {
          this.start.nextSibling.nodeValue = wrapped.value;
        }
      }

      return assertResult(new CustomSlotValue('test'), ['start', 'test', 'end']);
    });
  });

});

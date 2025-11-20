import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { AsyncIterationBuffer } from 'async-iteration-buffer';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/vdom.js';

describe('ListSlot', () => {
  let document = createDocument();

  function render(content) {
    return html`${content}`;
  }

  it('accepts an array', () => {
    let list = ['test-1', html`test-2`];
    let target = document.createElement('div');
    applyTemplate(target, render(list));
    assert.deepStrictEqual(target.toDataObject().childNodes, ['test-1', 'test-2']);
  });

  it('inserts slots', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    await buffer.next([
      renderChild('test-1'),
      renderChild('test-2'),
    ]);
    await buffer.next([
      renderChild('test-3'),
      renderChild('test-4'),
      renderChild('test-5'),
    ]);
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-3'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-5'] },
    ]);
  });

  it('removes slots', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    await buffer.next([
      renderChild('test-1'),
      renderChild('test-2'),
      renderChild('test-3'),
    ]);
    await buffer.next([
      renderChild('test-4'),
      renderChild('test-5'),
    ]);
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-5'] },
    ]);
    await buffer.next([
      renderChild('test-6'),
    ]);
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-6'] },
    ]);
  });

  it('repositions matching slots', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    function renderChild1(text) {
      return html`<div>${text}</div>`;
    }
    function renderChild2(text) {
      return html`<span>${text}</span>`;
    }
    await buffer.next([
      renderChild1('test-1'),
      renderChild2('test-2'),
    ]);
    let first = target.firstElementChild;
    await buffer.next([
      renderChild2('test-3'),
      renderChild1('test-4'),
    ]);
    assert.strictEqual(target.lastElementChild, first);
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'span', attributes: {}, childNodes: ['test-3'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
    ]);
  });

  it('removes all slots when removed', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    await buffer.next([
      'test-1',
      'test-2',
    ]);
    await buffer.next('text');
    assert.deepStrictEqual(target.toDataObject().childNodes, ['text']);
  });

  it('cancels updates on child slots', () => {
    let cancelled = false;
    let buffer = new AsyncIterationBuffer({
      cancel() { cancelled = true; },
    });
    let target = document.createElement('div');
    applyTemplate(target, render([
      html`${buffer}`,
    ]));
    assert.strictEqual(cancelled, false);
    applyTemplate(target, render(''));
    assert.strictEqual(cancelled, true);
  });

});

import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { AsyncIterationBuffer } from 'async-iteration-buffer';
import { html, applyTemplate } from '../src/index.js';
import { withKeys } from '../src/extras/index.js';
import { createDocument } from '../src/extras/vdom.js';
import { MapSlotValue } from '../src/extras/map-slot.js';

describe('MapSlot', () => {
  let document = createDocument();

  function render(content) {
    return html`${content}`;
  }

  it('accepts a Map object', () => {
    let map = new Map();
    map.set('a', 'test-1');
    map.set('b', html`test-2`);

    let target = document.createElement('div');
    applyTemplate(target, render(new MapSlotValue(map)));
    assert.deepStrictEqual(target.toDataObject().childNodes, ['test-1', 'test-2']);
  });

  it('accepts an array of key-value pairs', () => {
    let pairs = [
      ['a', 'test-1'],
      ['b', html`test-2`],
    ];
    let target = document.createElement('div');
    applyTemplate(target, render(new MapSlotValue(pairs)));
    assert.deepStrictEqual(target.toDataObject().childNodes, ['test-1', 'test-2']);
  });

  it('inserts slots', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    await buffer.next(new MapSlotValue([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
    ]));
    let first = target.firstElementChild;
    await buffer.next(new MapSlotValue([
      ['c', renderChild('test-3')],
      ['a', renderChild('test-4')],
      ['b', renderChild('test-5')],
    ]));
    assert.strictEqual(target.firstElementChild.nextElementSibling, first);
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
    await buffer.next(new MapSlotValue([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
      ['c', renderChild('test-3')],
    ]));
    let first = target.firstElementChild;
    await buffer.next(new MapSlotValue([
      ['d', renderChild('test-4')],
      ['e', renderChild('test-5')],
    ]));
    assert.strictEqual(target.firstElementChild !== first, true);
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-5'] },
    ]);
    await buffer.next(new MapSlotValue([
      ['d', renderChild('test-6')],
    ]));
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-6'] },
    ]);
  });

  it('repositions slots', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    await buffer.next(new MapSlotValue([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
    ]));
    let first = target.firstElementChild;
    await buffer.next(new MapSlotValue([
      ['b', renderChild('test-3')],
      ['a', renderChild('test-4')],
    ]));
    assert.strictEqual(target.lastElementChild, first);
    assert.deepStrictEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-3'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
    ]);
  });

  it('removes all slots when removed', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    await buffer.next(new MapSlotValue([
      ['a', 'test-1'],
      ['b', 'test-2'],
    ]));
    await buffer.next('text');
    assert.deepStrictEqual(target.toDataObject().childNodes, ['text']);
  });

  it('cancels updates on child slots', () => {
    let cancelled = false;
    let buffer = new AsyncIterationBuffer({
      cancel() { cancelled = true; },
    });
    let target = document.createElement('div');
    applyTemplate(target, render(new MapSlotValue([
      ['a', html`${buffer}`],
    ])));
    assert.strictEqual(cancelled, false);
    applyTemplate(target, render(''));
    assert.strictEqual(cancelled, true);
  });

  it('exposes withKeys helper', () => {
    let target = document.createElement('div');
    applyTemplate(target, render(withKeys([['a', 'test-1']])));
    assert.deepStrictEqual(target.toDataObject().childNodes, ['test-1']);
  });

});

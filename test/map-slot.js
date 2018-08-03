import assert from 'assert';
import { html, applyTemplate } from '../src';
import { withKeys } from '../src/extras';
import { createDocument } from '../src/extras/vdom.js';
import { MapSlot } from '../src/extras/map-slot.js';
import AsyncIterationBuffer from 'async-iteration-buffer';

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
    applyTemplate(target, render(MapSlot.value(map)));
    assert.deepEqual(target.toDataObject().childNodes, ['test-1', 'test-2']);
  });

  it('accepts an array of key-value pairs', () => {
    let pairs = [
      ['a', 'test-1'],
      ['b', html`test-2`],
    ];
    let target = document.createElement('div');
    applyTemplate(target, render(MapSlot.value(pairs)));
    assert.deepEqual(target.toDataObject().childNodes, ['test-1', 'test-2']);
  });

  it('inserts slots', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    await buffer.next(MapSlot.value([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
    ]));
    let first = target.firstElementChild;
    await buffer.next(MapSlot.value([
      ['c', renderChild('test-3')],
      ['a', renderChild('test-4')],
      ['b', renderChild('test-5')],
    ]));
    assert.equal(target.firstElementChild.nextElementSibling, first);
    assert.deepEqual(target.toDataObject().childNodes, [
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
    await buffer.next(MapSlot.value([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
      ['c', renderChild('test-3')],
    ]));
    let first = target.firstElementChild;
    await buffer.next(MapSlot.value([
      ['d', renderChild('test-4')],
      ['e', renderChild('test-5')],
    ]));
    assert.equal(target.firstElementChild !== first, true);
    assert.deepEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-5'] },
    ]);
    await buffer.next(MapSlot.value([
      ['d', renderChild('test-6')],
    ]));
    assert.deepEqual(target.toDataObject().childNodes, [
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
    await buffer.next(MapSlot.value([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
    ]));
    let first = target.firstElementChild;
    await buffer.next(MapSlot.value([
      ['b', renderChild('test-3')],
      ['a', renderChild('test-4')],
    ]));
    assert.equal(target.lastElementChild, first);
    assert.deepEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-3'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
    ]);
  });

  it('removes all slots when removed', async () => {
    let buffer = new AsyncIterationBuffer();
    let target = document.createElement('div');
    applyTemplate(target, render(buffer));
    await buffer.next(MapSlot.value([
      ['a', 'test-1'],
      ['b', 'test-2'],
    ]));
    await buffer.next('text');
    assert.deepEqual(target.toDataObject().childNodes, ['text']);
  });

  it('cancels updates on child slots', () => {
    let cancelled = false;
    let buffer = new AsyncIterationBuffer({
      cancel() { cancelled = true; },
    });
    let target = document.createElement('div');
    applyTemplate(target, render(MapSlot.value([
      ['a', html`${buffer}`],
    ])));
    assert.equal(cancelled, false);
    applyTemplate(target, render(''));
    assert.equal(cancelled, true);
  });

  it('exposes withKeys helper', () => {
    let value = withKeys([['a', 'test-1']]);
    assert.equal(value.slotConstructor, MapSlot);
  });

});

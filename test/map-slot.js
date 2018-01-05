import assert from 'assert';
import { html, applyTemplate } from '../src';
import { symbols } from '../src/symbols.js';
import { withKeys } from '../src/extras';
import { Document } from '../src/extras/vdom.js';
import { MapSlot } from '../src/extras/map-slot.js';
import { createPushStream } from './observable.js';

describe('MapSlot', () => {
  let document = new Document();

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

  it('inserts slots', () => {
    let stream = createPushStream();
    let target = document.createElement('div');
    applyTemplate(target, render(stream));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    stream.next(MapSlot.value([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
    ]));
    let first = target.firstElementChild;
    stream.next(MapSlot.value([
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

  it('removes slots', () => {
    let stream = createPushStream();
    let target = document.createElement('div');
    applyTemplate(target, render(stream));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    stream.next(MapSlot.value([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
      ['c', renderChild('test-3')],
    ]));
    let first = target.firstElementChild;
    stream.next(MapSlot.value([
      ['d', renderChild('test-4')],
      ['e', renderChild('test-5')],
    ]));
    assert.equal(target.firstElementChild !== first, true);
    assert.deepEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-5'] },
    ]);
    stream.next(MapSlot.value([
      ['d', renderChild('test-6')],
    ]));
    assert.deepEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-6'] },
    ]);
  });

  it('repositions slots', () => {
    let stream = createPushStream();
    let target = document.createElement('div');
    applyTemplate(target, render(stream));
    function renderChild(text) {
      return html`<div>${text}</div>`;
    }
    stream.next(MapSlot.value([
      ['a', renderChild('test-1')],
      ['b', renderChild('test-2')],
    ]));
    let first = target.firstElementChild;
    stream.next(MapSlot.value([
      ['b', renderChild('test-3')],
      ['a', renderChild('test-4')],
    ]));
    assert.equal(target.lastElementChild, first);
    assert.deepEqual(target.toDataObject().childNodes, [
      { nodeName: 'div', attributes: {}, childNodes: ['test-3'] },
      { nodeName: 'div', attributes: {}, childNodes: ['test-4'] },
    ]);
  });

  it('removes all slots when removed', () => {
    let stream = createPushStream();
    let target = document.createElement('div');
    applyTemplate(target, render(stream));
    stream.next(MapSlot.value([
      ['a', 'test-1'],
      ['b', 'test-2'],
    ]));
    stream.next('text');
    assert.deepEqual(target.toDataObject().childNodes, ['text']);
  });

  it('cancels updates on child slots', () => {
    let stream = createPushStream();
    let target = document.createElement('div');
    applyTemplate(target, render(MapSlot.value([
      ['a', html`${stream}`],
    ])));
    assert.equal(stream.observers.size, 1);
    applyTemplate(target, render(''));
    assert.equal(stream.observers.size, 0);
  });

  it('exposes withKeys helper', () => {
    let value = withKeys([['a', 'test-1']]);
    assert.equal(value[symbols.slotConstructor], MapSlot);
  });

});

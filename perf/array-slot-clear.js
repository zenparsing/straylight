import assert from 'assert';
import { html, applyTemplate } from '../src';
import { createDocument } from './document.js';
import AsyncIterationBuffer from 'async-iteration-buffer';

describe('Array slot clear', () => {
  it('removes all children in a batch when cleared', async () => {
    let results = [];
    let buffer = new AsyncIterationBuffer();
    let element = createDocument(results).createElement('div');
    applyTemplate(element, html`${ buffer }`);
    await buffer.next([1, 2, 3, 4, 5]);
    await buffer.next([]);
    let calls = results.filter(x => x.name === 'removeChild' && x.action === 'call');
    assert.deepEqual(calls.length, 6);
  });
});

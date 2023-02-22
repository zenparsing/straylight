import * as assert from 'assert';
import { describe, it, before, beforeEach, after } from 'moon-unit';
import { AsyncIterationBuffer } from 'async-iteration-buffer';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/extras/vdom.js';

describe('Pending updates', () => {
  let document = createDocument();
  let errors = [];
  let pushError = err => errors.push(err);
  let render = val => html`<div x=${val} />`;

  before(() => {
    process.addListener('unhandledRejection', pushError);
  });

  beforeEach(async () => {
    await new Promise(resolve => setTimeout(resolve));
    errors.length = 0;
  });

  after(() => {
    process.removeListener('unhandledRejection', pushError);
  });

  describe('Async iterators', () => {
    it('updates values', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      assert.strictEqual(elem.getAttribute('x'), null);
      await buffer.next('a');
      assert.strictEqual(elem.getAttribute('x'), 'a');
      await buffer.next('b');
      assert.strictEqual(elem.getAttribute('x'), 'b');
      await buffer.return();
      assert.strictEqual(elem.getAttribute('x'), 'b');
      applyTemplate(target, render('c'));
      assert.strictEqual(elem.getAttribute('x'), 'c');
    });

    it('cancels when updated with a new value', async () => {
      let cancelled = false;
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.next('a');
      applyTemplate(target, render('b'));
      assert.strictEqual(cancelled, true);
      assert.strictEqual(elem.getAttribute('x'), 'b');
    });

    it('cancels when a new template is applied', () => {
      let target = document.createElement('div');
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      applyTemplate(target, render(buffer));
      applyTemplate(target, html`test`);
      assert.strictEqual(cancelled, true);
    });

    it('cancels a rejection when updated with a new value', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.throw(new Error('test'));
      applyTemplate(target, render('b'));
      assert.strictEqual(elem.getAttribute('x'), 'b');
    });

    it('cancels when an error is thrown from update', async () => {
      let target = document.createElement('div');
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      assert.strictEqual(cancelled, false);
      await buffer.next({
        toString() { throw new Error('x'); },
      });
      assert.strictEqual(cancelled, true);
      applyTemplate(target, render('b'));
      assert.strictEqual(elem.getAttribute('x'), 'b');
    });

    it('handles iterators with no return method', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      let iter = buffer[Symbol.asyncIterator]();
      iter.return = undefined;
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.next('a');
      applyTemplate(target, render('b'));
      applyTemplate(target, render('a'));
      assert.strictEqual(elem.getAttribute('x'), 'a');
    });

    it('does not cancel when updated with the same value', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.next('a');
      assert.strictEqual(elem.getAttribute('x'), 'a');
    });

    it('handles errors', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      buffer.throw(new Error('test'));
      await new Promise(resolve => setTimeout(resolve));
      assert.strictEqual(errors.length, 1);
      applyTemplate(target, render('a'));
      assert.strictEqual(elem.getAttribute('x'), 'a');
    });
  });
});

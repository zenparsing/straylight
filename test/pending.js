import assert from 'assert';
import { html, applyTemplate } from '../src/index.js';
import { symbols } from '../src/symbols.js';
import { createDocument } from '../src/extras/vdom.js';
import { AsyncIterationBuffer } from 'async-iteration-buffer';

describe('Pending updates', () => {
  let document = createDocument();
  let errors = [];
  let pushError = err => errors.push(err);
  let render = val => html`<div x=${val} />`;

  before(() => {
    process.addListener('unhandledRejection', pushError);
  });

  beforeEach(() => {
    errors.length = 0;
  });

  after(() => {
    process.removeListener('unhandledRejection', pushError);
  });

  describe('Promises', () => {
    it('updates values', async () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let elem = target.firstElementChild;
      assert.equal(elem.getAttribute('x'), undefined);
      await promise;
      assert.equal(elem.getAttribute('x'), 'a');
      applyTemplate(target, render('b'));
      assert.equal(elem.getAttribute('x'), 'b');
    });

    it('cancels when updated with a new value', async () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let elem = target.firstElementChild;
      assert.equal(elem.getAttribute('x'), undefined);
      applyTemplate(target, render('b'));
      assert.equal(elem.getAttribute('x'), 'b');
      await promise;
      assert.equal(elem.getAttribute('x'), 'b');
    });

    it('cancels when a new template is applied', async () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      applyTemplate(target, html`test`);
      await promise;
      assert.ok(true);
    });

    it('cancels a rejection when updated with a new value', async () => {
      let promise = Promise.reject(new Error('test'));
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let elem = target.firstElementChild;
      applyTemplate(target, render('b'));
      assert.equal(elem.getAttribute('x'), 'b');
      await promise.catch(() => {});
      assert.equal(elem.getAttribute('x'), 'b');
    });

    it('does not cancel when updated with the same value', async () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      applyTemplate(target, render(promise));
      let elem = target.firstElementChild;
      await promise;
      assert.equal(elem.getAttribute('x'), 'a');
    });

    it('handles errors', async () => {
      let promise = Promise.reject(new Error('test'));
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let elem = target.firstElementChild;
      await new Promise(resolve => setTimeout(resolve));
      assert.equal(errors.length, 1);
      applyTemplate(target, render('a'));
      assert.equal(elem.getAttribute('x'), 'a');
    });
  });

  describe('Async iterators', () => {
    it('updates values', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      assert.equal(elem.getAttribute('x'), undefined);
      await buffer.next('a');
      assert.equal(elem.getAttribute('x'), 'a');
      await buffer.next('b');
      assert.equal(elem.getAttribute('x'), 'b');
      await buffer.return();
      assert.equal(elem.getAttribute('x'), 'b');
      applyTemplate(target, render('c'));
      assert.equal(elem.getAttribute('x'), 'c');
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
      assert.equal(cancelled, true);
      assert.equal(elem.getAttribute('x'), 'b');
    });

    it('cancels when a new template is applied', () => {
      let target = document.createElement('div');
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      applyTemplate(target, render(buffer));
      applyTemplate(target, html`test`);
      assert.equal(cancelled, true);
    });

    it('cancels a rejection when updated with a new value', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.throw(new Error('test'));
      applyTemplate(target, render('b'));
      assert.equal(elem.getAttribute('x'), 'b');
    });

    it('cancels when an error is thrown from update', async () => {
      let target = document.createElement('div');
      let cancelled = false;
      let buffer = new AsyncIterationBuffer({
        cancel() { cancelled = true; },
      });
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      assert.equal(cancelled, false);
      await buffer.next({
        toString() { throw new Error('x'); },
      });
      assert.equal(cancelled, true);
      applyTemplate(target, render('b'));
      assert.equal(elem.getAttribute('x'), 'b');
    });

    it('handles iterators with no return method', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      let iter = buffer[symbols.asyncIterator]();
      iter.return = undefined;
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.next('a');
      applyTemplate(target, render('b'));
      applyTemplate(target, render('a'));
      assert.equal(elem.getAttribute('x'), 'a');
    });

    it('does not cancel when updated with the same value', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      await buffer.next('a');
      assert.equal(elem.getAttribute('x'), 'a');
    });

    it('handles errors', async () => {
      let target = document.createElement('div');
      let buffer = new AsyncIterationBuffer();
      applyTemplate(target, render(buffer));
      let elem = target.firstElementChild;
      buffer.throw(new Error('test'));
      await new Promise(resolve => setTimeout(resolve));
      assert.equal(errors.length, 1);
      applyTemplate(target, render('a'));
      assert.equal(elem.getAttribute('x'), 'a');
    });
  });
});

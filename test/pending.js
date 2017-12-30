import { html, applyTemplate } from '../src';
import { symbols } from '../src/symbols.js';
import { vdom } from '../src/extras';
import assert from 'assert';
import { createPushStream, setObservableErrorHandler } from './observable.js';

function createAsyncIterator() {
  let results = [];
  let requests = [];
  let done = false;
  function resolveNext() {
    while (requests.length > 0 && (results.length > 0 || done)) {
      let request = requests.shift();
      if (done) {
        request.resolve({ done });
      } else {
        let result = results.shift();
        if (result instanceof Error) {
          request.reject(result);
        } else {
          request.resolve(result);
          if (result.done) {
            done = true;
          }
        }
      }
    }
  }
  return {
    [symbols.asyncIterator]() { return this; },
    returnCalled: false,
    yield(result) {
      if (!done) {
        results.push(result);
        resolveNext();
      }
    },
    next() {
      return new Promise((resolve, reject) => {
        requests.push({ resolve, reject });
      });
    },
    return() {
      this.returnCalled = true;
      this.yield({ done: true });
      return this.next();
    },
  };
}

describe('Pending updates', () => {
  let document = new vdom.Document();
  let errors = [];
  let pushError = err => errors.push(err);
  let render = val => html`<div x=${val} />`;

  before(() => {
    setObservableErrorHandler(pushError);
    process.addListener('unhandledRejection', pushError);
  });

  beforeEach(() => {
    errors.length = 0;
  });

  after(() => {
    setObservableErrorHandler();
    process.removeListener('unhandledRejection', pushError);
  });

  describe('Observables', () => {
    it('updates values', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, render(stream));
      let { firstChild } = target;
      assert.equal(firstChild.attributes.get('x'), undefined);
      stream.next('a');
      assert.equal(firstChild.attributes.get('x'), 'a');
      stream.next('b');
      assert.equal(firstChild.attributes.get('x'), 'b');
      stream.complete();
      assert.equal(firstChild.attributes.get('x'), 'b');
      applyTemplate(target, render('c'));
      assert.equal(firstChild.attributes.get('x'), 'c');
    });

    it('cancels when updated with a new value', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, render(stream));
      assert.equal(stream.observers.size, 1);
      let { firstChild } = target;
      assert.equal(firstChild.attributes.get('x'), undefined);
      applyTemplate(target, render('a'));
      assert.equal(stream.observers.size, 0);
      assert.equal(firstChild.attributes.get('x'), 'a');
      stream.next('b');
      assert.equal(firstChild.attributes.get('x'), 'a');
    });

    it('cancels when a new template is applied', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, render(stream));
      assert.equal(stream.observers.size, 1);
      applyTemplate(target, html`test`);
    });

    it('does not cancel when updated with same value', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, render(stream));
      applyTemplate(target, render(stream));
      let { firstChild } = target;
      assert.equal(firstChild.attributes.get('x'), undefined);
      stream.next('a');
      assert.equal(firstChild.attributes.get('x'), 'a');
    });

    it('handles errors', () => {
      let stream = createPushStream();
      let target = document.createElement('div');
      applyTemplate(target, render(stream));
      let { firstChild } = target;
      stream.error(new Error('test'));
      assert.equal(errors.length, 1);
      applyTemplate(target, render('a'));
      assert.equal(firstChild.attributes.get('x'), 'a');
    });
  });

  describe('Promises', () => {
    it('updates values', () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let { firstChild } = target;
      assert.equal(firstChild.attributes.get('x'), undefined);
      return promise.then(() => {
        assert.equal(firstChild.attributes.get('x'), 'a');
        applyTemplate(target, render('b'));
        assert.equal(firstChild.attributes.get('x'), 'b');
      });
    });

    it('cancels when updated with a new value', () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let { firstChild } = target;
      assert.equal(firstChild.attributes.get('x'), undefined);
      applyTemplate(target, render('b'));
      assert.equal(firstChild.attributes.get('x'), 'b');
      return promise.then(() => {
        assert.equal(firstChild.attributes.get('x'), 'b');
      });
    });

    it('cancels when a new template is applied', () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      applyTemplate(target, html`test`);
      return promise.then(() => {
        assert.ok(true);
      });
    });

    it('cancels a rejection when updated with a new value', () => {
      let promise = Promise.reject(new Error('test'));
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let { firstChild } = target;
      applyTemplate(target, render('b'));
      assert.equal(firstChild.attributes.get('x'), 'b');
      return promise.catch(() => {
        assert.equal(firstChild.attributes.get('x'), 'b');
      });
    });

    it('does not cancel when updated with the same value', () => {
      let promise = Promise.resolve('a');
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      applyTemplate(target, render(promise));
      let { firstChild } = target;
      return promise.then(() => {
        assert.equal(firstChild.attributes.get('x'), 'a');
      });
    });

    it('handles errors', () => {
      let promise = Promise.reject(new Error('test'));
      let target = document.createElement('div');
      applyTemplate(target, render(promise));
      let { firstChild } = target;
      return new Promise(resolve => setTimeout(resolve)).then(() => {
        assert.equal(errors.length, 1);
        applyTemplate(target, render('a'));
        assert.equal(firstChild.attributes.get('x'), 'a');
      });
    });
  });

  describe('Async iterators', () => {
    it('updates values', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      applyTemplate(target, render(iterator));
      let { firstChild } = target;
      assert.equal(firstChild.attributes.get('x'), undefined);
      iterator.yield({ value: 'a' });
      return Promise.resolve().then(() => {
        assert.equal(firstChild.attributes.get('x'), 'a');
        iterator.yield({ value: 'b' });
      }).then(() => {
        assert.equal(firstChild.attributes.get('x'), 'b');
        iterator.yield({ done: true });
      }).then(() => {
        assert.equal(firstChild.attributes.get('x'), 'b');
        applyTemplate(target, render('c'));
        assert.equal(firstChild.attributes.get('x'), 'c');
      });
    });

    it('cancels when updated with a new value', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      applyTemplate(target, render(iterator));
      let { firstChild } = target;
      iterator.yield({ value: 'a' });
      applyTemplate(target, render('b'));
      assert.equal(iterator.returnCalled, true);
      return Promise.resolve(() => {
        assert.equal(firstChild.attributes.get('x'), 'b');
      });
    });

    it('cancels when a new template is applied', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      applyTemplate(target, render(iterator));
      applyTemplate(target, html`test`);
      assert.equal(iterator.returnCalled, true);
    });

    it('cancels a rejection when updated with a new value', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      applyTemplate(target, render(iterator));
      let { firstChild } = target;
      iterator.yield(new Error('test'));
      applyTemplate(target, render('b'));
      return Promise.resolve(() => {
        assert.equal(firstChild.attributes.get('x'), 'b');
      });
    });

    it('handles iterators with no return method', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      iterator.return = undefined;
      applyTemplate(target, render(iterator));
      let { firstChild } = target;
      iterator.yield({ value: 'a' });
      applyTemplate(target, render('b'));
      assert.equal(iterator.returnCalled, false);
      return Promise.resolve(() => {
        applyTemplate(target, render('a'));
        assert.equal(firstChild.attributes.get('x'), 'a');
      });
    });

    it('does not cancel when updated with the same value', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      applyTemplate(target, render(iterator));
      applyTemplate(target, render(iterator));
      let { firstChild } = target;
      iterator.yield({ value: 'a' });
      return Promise.resolve(() => {
        assert.equal(firstChild.attributes.get('x'), 'a');
      });
    });

    it('handles errors', () => {
      let target = document.createElement('div');
      let iterator = createAsyncIterator();
      applyTemplate(target, render(iterator));
      let { firstChild } = target;
      iterator.yield(new Error('test'));
      return new Promise(resolve => setTimeout(resolve)).then(() => {
        assert.equal(errors.length, 1);
        applyTemplate(target, render('a'));
        assert.equal(firstChild.attributes.get('x'), 'a');
      });
    });
  });
});

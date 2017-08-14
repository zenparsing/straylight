import PushStream from 'zen-push';
import * as symbols from './symbols.js';

export class Store {

  constructor(data) {
    this._stream = new PushStream();
    this._data = Object.assign({}, data);
  }

  read(fn) {
    return fn ? fn(this._data) : this._data;
  }

  update(data) {
    if (typeof data === 'function') {
      data = data(this._data);
    }

    if (data === null || data === undefined || data === this._data) {
      return;
    }

    let updated = false;

    Object.keys(data).forEach(key => {
      let prev = this._data[key];
      let next = data[key];

      if (prev !== next) {
        // Non-identical values trigger updates
        updated = true;
        this._data[key] = next;
      } else if (prev && typeof prev === 'object') {
        // Assume that identitical objects have been mutated
        updated = true;
      }
    });

    if (updated) {
      this._stream.next(this._data);
    }
  }

  subscribe(...args) {
    return this._stream.observable.subscribe(...args);
  }

  [symbols.observable]() {
    return this._stream.observable;
  }

}

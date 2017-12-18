import Observable from 'zen-observable';
import PushStream from 'zen-push';
import * as symbols from './symbols.js';

export class Store {

  constructor(data) {
    this._data = Object.create(null);
    this._stream = new PushStream(this);
    this._updates = new Observable(sink => {
      let subscription = this._stream.observable.subscribe(sink);
      sink.next(this._data);
      return subscription;
    });

    if (data) {
      for (let key in data) {
        this._data[key] = data[key];
      }
    }
  }

  getState(fn) {
    return fn ? fn(this._data) : this._data;
  }

  setState(data) {
    if (typeof data === 'function') {
      data = data(this._data);
    }

    if (data === null || data === undefined || data === this._data) {
      return;
    }

    let updated = false;
    for (let key in data) {
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
    }

    if (updated) {
      this._stream.next(this._data);
    }
  }

  subscribe(fn) {
    return this._updates.subscribe(fn);
  }

  [symbols.observable]() {
    return this._updates;
  }

}

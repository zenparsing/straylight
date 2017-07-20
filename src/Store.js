import { PushStream } from './PushStream.js';
import * as symbols from './symbols.js';

export class Store {

  constructor(data) {
    this._stream = new PushStream();
    this._data = Object.assign(Object.create(null), data);
  }

  read(fn) {
    return fn ? fn(this._data) : Object.assign(Object.create(null), this._data);
  }

  update(data) {
    if (typeof data === 'function') {
      data = data(this._data);
    }
    Object.assign(this._data, data);
    this._stream.push(this._data);
  }

  subscribe(...args) {
    return this._stream.observable.subscribe(...args);
  }

  [symbols.observable]() {
    return this._stream.observable;
  }

}

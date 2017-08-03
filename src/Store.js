import { PushStream } from './PushStream.js';
import * as symbols from './symbols.js';

export class Store {

  constructor(data) {
    this._stream = new PushStream();
    this._data = { ...data };
  }

  read(fn) {
    return fn ? fn(this._data) : this._data;
  }

  update(data) {
    if (typeof data === 'function') {
      data = data(this._data);
    }
    if (data !== null && data !== undefined && data !== this._data) {
      Object.keys(data).forEach(key => this._data[key] = data[key]);
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

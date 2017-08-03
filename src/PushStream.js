import Observable from 'zen-observable';

function forEachObserver(observers, fn) {
  let list = [];
  observers.forEach(observer => list.push(observer));
  list.forEach(fn);
}

function reportError(err) {
  Promise.reject(err);
}

export class PushStream {

  constructor() {
    this._observers = new Set();
    this._observable = new Observable(observer => {
      this._observers.add(observer);
      return () => this._observers.delete(observer);
    });
  }

  get observable() {
    return this._observable;
  }

  get observed() {
    return this._observers.size > 0;
  }

  next(x) {
    forEachObserver(this._observers, observer => {
      try { observer.next(x); } catch (e) { reportError(e); }
    });
  }

  error(e) {
    forEachObserver(this._observers, observer => {
      try { observer.error(e); } catch (e) { reportError(e); }
    });
  }

  complete() {
    forEachObserver(this._observers, observer => {
      try { observer.complete(); } catch (e) { reportError(e); }
    });
  }

}

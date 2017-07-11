import Observable from 'zen-observable';

function forEachObserver(observers, fn) {
  let list = [];
  observers.forEach(observer => list.push(observer));
  list.forEach(fn);
}

export class PushStream {

  constructor(onError = (e => console.error(e))) {
    this._onError = onError;
    this._observers = new Set();
    this._observable = new Observable(observer => {
      this._observers.add(observer);
      return () => this._observers.delete(observer);
    });
  }

  get observable() {
    return this._observable;
  }

  end() {
    forEachObserver(this._observers, observer => {
      try { observer.complete(); } catch (e) { this._onError(e); }
    });
  }

  push(x) {
    forEachObserver(this._observers, observer => {
      try { observer.next(x); } catch (e) { this._onError(e); }
    });
  }

}

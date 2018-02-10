import Observable from 'zen-observable';

export { Observable };

export function createPushStream() {
  let set = new Set();
  let observable = new Observable(sink => {
    set.add(sink);
    return () => set.delete(sink);
  });
  observable.next = value => set.forEach(sink => sink.next(value));
  observable.error = error => set.forEach(sink => sink.error(error));
  observable.complete = () => set.forEach(sink => sink.complete());
  observable.observers = set;
  return observable;
}

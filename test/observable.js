import Observable from 'zen-observable';

Observable.extensions.setHostReportError(err => { throw err; });

export { Observable };

export function createPushStream() {
  let set = new Set();
  let observable = new Observable(sink => {
    set.add(sink);
    return () => set.delete(sink);
  });
  observable.next = value => set.forEach(sink => sink.next(value));
  observable.complete = () => set.forEach(sink => sink.complete());
  return observable;
}

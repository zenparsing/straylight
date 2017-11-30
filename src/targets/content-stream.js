import Observable from 'zen-observable';
import * as symbols from '../symbols.js';

export function toContentStream(updates) {
  return updates[symbols.element] ? Observable.of(updates) : Observable.from(updates);
}

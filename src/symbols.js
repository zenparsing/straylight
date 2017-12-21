let S = {};

if (typeof Symbol === 'function') {
  S = Symbol;
  // Ponyfill Symbol.observable for interoperability with other libraries
  if (!S.observable) {
    S.observable = S('observable');
  }
}

export const symbols = {
  observable: S.observable || '@@observable',
  iterator: S.iterator || '@@iterator',
  asyncIterator: S.asyncIterator || '@@asyncIterator',
};

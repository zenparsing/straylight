const S = typeof Symbol === 'function' ? Symbol : {};

export const symbols = {
  get observable() { return S.observable || '@@observable'; },
  get iterator() { return S.iterator || '@@iterator'; },
  get asyncIterator() { return S.asyncIterator || '@@asyncIterator'; },
};

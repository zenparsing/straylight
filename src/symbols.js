const S = typeof Symbol === 'function' ? Symbol : (name => `@@${name}`);

function getSymbol(name, ponyfill) {
  let sym = S[name] || S(name);
  if (ponyfill) {
    S[name] = sym;
  }
  return sym;
}

export const symbols = {
  observable: getSymbol('observable', true),
  iterator: getSymbol('iterator'),
  asyncIterator: getSymbol('asyncIterator'),
  createSlot: getSymbol('createSlot'),
};

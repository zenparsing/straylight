import { Symbol } from './shim.js';

function getSymbol(name, ponyfill) {
  let sym = Symbol[name] || Symbol(name);
  if (ponyfill) {
    Symbol[name] = sym;
  }
  return sym;
}

export const symbols = {
  observable: getSymbol('observable', true),
  iterator: getSymbol('iterator'),
  asyncIterator: getSymbol('asyncIterator'),
  slotConstructor: getSymbol('slotConstructor'),
};

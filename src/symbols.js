import { Symbol } from './shim.js';

function getSymbol(name) {
  return Symbol[name] || Symbol(name);
}

export const symbols = {
  iterator: getSymbol('iterator'),
  asyncIterator: getSymbol('asyncIterator'),
  createSlot: Symbol('createSlot'),
};

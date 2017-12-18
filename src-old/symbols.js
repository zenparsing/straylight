import observableSymbol from 'symbol-observable';

const sym = typeof Symbol === 'function' ? Symbol : name => `@@${name}`;

export const observable = observableSymbol;
export const render = sym('render');
export const element = sym('element');

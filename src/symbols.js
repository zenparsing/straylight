import observableSymbol from 'symbol-observable';

const sym = typeof Symbol === 'function' ? Symbol : name => `@@${name}`;

export const observable = observableSymbol;
export const renderElement = sym('renderElement');
export const targetUpdates = sym('targetUpdates');

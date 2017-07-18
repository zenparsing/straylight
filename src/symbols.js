import observableSymbol from 'symbol-observable';

const sym = typeof Symbol === 'function' ? Symbol : name => `@@${name}`;

export const observable = observableSymbol;
export const elementKey = sym('elementKey');
export const renderElement = sym('renderElement');
export const contentManager = sym('contentManager');

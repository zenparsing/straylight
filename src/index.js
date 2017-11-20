import htmltag from 'htmltag';
import { Element } from './Element.js';
import * as symbols from './symbols.js';

export { symbols };
export { Element };

export { UI } from './UI.js';
export { Store } from './Store.js';
export { renderToDOM } from './targets/dom.js';
export { renderToString } from './targets/string.js';

export function createElement(tag, props, children) {
  return new Element(tag, props, children);
}

export const html = htmltag(createElement, {
  createFragment: Element.from,
  cache: new WeakMap(),
});

import htmltag from 'htmltag';
import { Element } from './Element.js';
import * as symbols from './symbols.js';

export { symbols };
export { Element };

export { UI } from './UI.js';
export { Store } from './Store.js';
export { renderToDOM, renderToDOM as updateDOM } from './targets/dom.js';
export { renderToString } from './targets/string.js';

const registry = new Map();

export function createElement(tag, props, children) {
  if (typeof tag === 'string') {
    tag = registry.get(tag) || tag;
  }
  return new Element(tag, props, children);
}

export const html = htmltag(createElement, {
  createFragment: Element.from,
  cache: new WeakMap(),
});

html.define = (name, def) => void registry.set(name, def);

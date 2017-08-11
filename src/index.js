import htmltag from 'htmltag';
import { Element } from './Element.js';

export { Element };
export { UI } from './UI.js';

export { renderToDOM } from './dom-target.js';
export { renderToString } from './string-target.js';

export function createElement(tag, props, children) {
  return new Element(tag, props, children);
}

export const html = htmltag(createElement, {
  createFragment: Element.from,
});

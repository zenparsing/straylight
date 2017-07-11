import htmltag from 'htmltag';
import { Element } from './Element.js';

export { Element };
export { StringTarget } from './StringTarget.js';
export { DOMTarget } from './DOMTarget.js';
export { UI } from './UI.js';

export function createElement(tag, props, children) {
  return new Element(tag, props, children);
}

export const html = htmltag(createElement, {
  createFragment: Element.from,
});

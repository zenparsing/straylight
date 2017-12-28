import htmltag from 'htmltag';
import { TemplateUpdater } from './updaters.js';
import * as dom from './dom.js';

export const html = htmltag({ cache: new WeakMap() });

const updaterMap = new WeakMap();

export function applyTemplate(target, template) {
  if (typeof target === 'string' && typeof window === 'object') {
    target = window.document.querySelector(target);
  }
  if (!dom.isElement(target)) {
    throw new TypeError(`${target} is not a DOM element`);
  }
  let updater = updaterMap.get(target);
  if (!updater) {
    updater = new TemplateUpdater(target);
    updaterMap.set(target, updater);
  }
  updater.update(template);
}

import { html, TemplateResult } from 'htmltag';
import { createSlot, removeSlot } from './slots.js';
import { ChildUpdater } from './updaters.js';
import { symbols } from './symbols.js';
import * as dom from './dom.js';

const createSlotSymbol = symbols.createSlot;

const updaterMap = new WeakMap();

function applyTemplate(target, template) {
  if (typeof target === 'string' && typeof document === 'object') {
    target = document.querySelector(target);
  }
  if (!target || typeof target.appendChild !== 'function') {
    throw new TypeError(`${target} is not a valid DOM target`);
  }
  if (!(template instanceof TemplateResult)) {
    throw new TypeError(`${template} is not a TemplateResult object`);
  }
  let updater = updaterMap.get(target);
  if (!updater) {
    let next = dom.firstChild(target);
    if (next) {
      dom.removeSiblings(next, null);
    }
    updater = new ChildUpdater(target);
    updaterMap.set(target, updater);
  }
  updater.update(template);
}

export {
  html,
  applyTemplate,
  createSlot,
  removeSlot,
  createSlotSymbol,
};

import { html, TemplateResult } from 'htmltag';
import { createSlot, updateSlot, removeSlot } from './slots.js';

import * as symbols from './symbols.js';
import * as dom from './dom.js';

const createSlotSymbol = symbols.createSlot;

const slotMap = new WeakMap();

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
  let slot = slotMap.get(target);
  if (slot) {
    slot = updateSlot(slot, template);
  } else {
    let next = dom.firstChild(target);
    slot = createSlot(null, target, next, template);
    if (next) {
      dom.removeSiblings(next, null);
    }
  }
  slotMap.set(target, slot);
}

export {
  html,
  applyTemplate,
  createSlot,
  updateSlot,
  removeSlot,
  createSlotSymbol,
};

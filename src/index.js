import { html, TemplateResult } from 'htmltag';

import {
  createSlotSymbol,
  createSlot,
  updateSlot,
  removeSlot } from './slots.js';

import * as dom from './dom.js';

const slotMap = new WeakMap();

function applyTemplate(target, template) {
  if (typeof target === 'string' && typeof document === 'object') {
    target = document.querySelector(target);
  }
  if (!target || typeof target.appendChild !== 'function') {
    throw new TypeError(`${target} is not a valid DOM target`);
  }
  let slot = slotMap.get(target);
  if (slot) {
    slot = updateSlot(slot, template);
  } else {
    let next = dom.firstChild(target);
    slot = createSlot(target, next, template);
    if (next) {
      dom.removeSiblings(next, null);
    }
  }
  slotMap.set(target, slot);
}

export {
  html,
  TemplateResult,
  applyTemplate,
  createSlotSymbol,
  createSlot,
  updateSlot,
  removeSlot,
};

import { createSlot, removeSlot } from './slots.js';
import * as dom from './dom.js';

const slotMap = new WeakMap();

export { html } from 'htmltag';

export function applyTemplate(target, value) {
  if (typeof target === 'string' && typeof window === 'object') {
    target = window.document.querySelector(target);
  }
  if (!dom.isElement(target)) {
    throw new TypeError(`${target} is not a DOM element`);
  }
  let slot = slotMap.get(target);
  if (slot && slot.matches(value)) {
    slot.update(value);
  } else {
    if (slot) {
      removeSlot(slot);
    }
    slot = createSlot(target, null, value);
    slotMap.set(target, slot);
  }
}

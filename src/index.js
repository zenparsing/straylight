import { html, TemplateResult } from 'htmltag';
import { createSlot, removeSlot } from './slots.js';
import * as dom from './dom.js';

const slotMap = new WeakMap();

export { html };

export function applyTemplate(target, template) {
  if (typeof target === 'string' && typeof document === 'object') {
    target = document.querySelector(target);
  }
  if (!dom.isElement(target)) {
    throw new TypeError(`${target} is not a DOM element`);
  }
  if (!(template instanceof TemplateResult)) {
    throw new TypeError(`${template} is not a TemplateResult object`);
  }
  let slot = slotMap.get(target);
  if (slot && slot.matches(template)) {
    slot.update(template);
  } else {
    if (slot) {
      removeSlot(slot);
    }
    slot = createSlot(target, null, template);
    slotMap.set(target, slot);
  }
}

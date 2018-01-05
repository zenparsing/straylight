import { applyTemplate } from '../index.js';
import { MapSlot } from './map-slot.js';
import { Document } from './vdom.js';

// [Experimental]
export function withKeys(map) {
  return MapSlot.value(map);
}

export function stringify(template) {
  let target = new Document().createElement('div');
  applyTemplate(target, template);
  return target.innerHTML;
}

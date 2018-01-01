import { applyTemplate } from '../index.js';
import * as vdom from './vdom.js';

export * from './map-slot.js';

export { vdom };

export function stringify(template) {
  let target = new vdom.Document().createElement('div');
  applyTemplate(target, template);
  return target.childNodes.map(child => child.toHTML()).join('');
}

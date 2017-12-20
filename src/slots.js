import htmltag from 'htmltag';
import { TemplateUpdater } from './updaters.js';
import * as dom from './dom.js';

export function createSlot(value, next) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return new TextSlot(value, next);
  }

  if (value instanceof Element) {
    return new ElementSlot(value, next);
  }

  if (htmltag.isTemplateResult(value)) {
    return new TemplateSlot(value, next);
  }

  throw new TypeError('Invalid child slot value');
}

function removeSlot(slot) {
  dom.removeSiblings(slot.start, slot.end);
}

class TextSlot {
  constructor(value, next) {
    value = this.convert(value);
    let node = dom.createText(value, next);
    this.start = node;
    this.end = node;
    this.last = value;
    dom.insertBefore(node, next);
  }

  convert(value) {
    if (value == null) { // or undefined
      return '';
    }
    return typeof value === 'string' ? value : String(value);
  }

  matches(value) {
    return value === null || typeof value !== 'object';
  }

  update(value) {
    value = this.convert(value);
    if (value !== this.last) {
      this.last = value;
      dom.setTextValue(this.start, value);
    }
  }
}

class ElementSlot {
  constructor(element, next) {
    this.start = element;
    this.end = element;
    dom.insertBefore(element, next);
  }

  matches(value) {
    return this.start === value;
  }

  remove() {
    removeSlot(this);
  }

  update() {
    // Empty
  }
}

export class TemplateSlot {
  constructor(template, next) {
    let fragment = dom.createFragment(next);
    this.updater = new TemplateUpdater(fragment);
    this.updater.update(template);
    this.start = fragment.firstChild;
    this.end = fragment.lastChild;
    dom.insertBefore(fragment, next);
  }

  cancelUpdates() {
    this.updater.cancelUpdates();
  }

  matches(value) {
    return (
      htmltag.isTemplateResult(value) &&
      value.source === this.updater.source
    );
  }

  remove() {
    removeSlot(this);
    this.cancelUpdates();
  }

  update(template) {
    // Assert: template.source === this.updates.source
    this.updater.update(template);
  }
}

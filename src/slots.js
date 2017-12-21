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

  if (htmltag.isTemplateResult(value)) {
    return new TemplateSlot(value, next);
  }

  throw new TypeError('Invalid child slot value');
}

function convertToString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
}

class TextSlot {
  constructor(value, next) {
    value = convertToString(value);
    let node = dom.createText(value, next);
    this.start = node;
    this.end = node;
    this.last = value;
    dom.insertBefore(node, next);
  }

  cancelUpdates() {
    // Empty
  }

  matches(value) {
    return value === null || typeof value !== 'object';
  }

  update(value) {
    value = convertToString(value);
    if (value !== this.last) {
      this.last = value;
      dom.setTextValue(this.start, value);
    }
  }
}

export class TemplateSlot {
  constructor(template, next) {
    let fragment = dom.createFragment(next);
    this.updater = new TemplateUpdater(fragment);
    this.updater.update(template);
    this.start = dom.firstChild(fragment);
    this.end = dom.lastChild(fragment);
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

  update(template) {
    // Assert: template.source === this.updates.source
    this.updater.update(template);
  }
}

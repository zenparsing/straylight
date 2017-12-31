import { TemplateResult } from 'htmltag';
import { TemplateUpdater } from './updaters.js';
import { symbols } from './symbols.js';
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

  if (isIterable(value)) {
    return new ArraySlot(value, next);
  }

  if (value instanceof TemplateResult) {
    return new TemplateSlot(value, next);
  }

  throw new TypeError('Invalid child slot value');
}

function isIterable(value) {
  return (
    Array.isArray(value) ||
    value && typeof value !== 'string' && value[symbols.iterator]
  );
}

class ArraySlot {
  constructor(value, next) {
    this.slots = [];
    this.next = next;
    this.update(value);
  }

  get start() {
    return this.slots[0].start;
  }

  get end() {
    return this.slots[this.slots.length - 1].end;
  }

  cancelUpdates() {
    for (let i = 0; i < this.slots.length; ++i) {
      this.slots[i].cancelUpdates();
    }
  }

  matches(value) {
    return isIterable(value);
  }

  update(list) {
    let i = 0;
    if (Array.isArray(list)) {
      while (i < list.length) {
        this.updateItem(list[i], i++);
      }
    } else {
      for (let item of list) {
        this.updateItem(item, i++);
      }
    }
    if (i === 0) {
      this.updateItem('', i++);
    }
    this.removeSlots(i);
  }

  updateItem(value, i) {
    let pos = this.findMatch(value, i);
    if (pos === -1) {
      this.insertSlot(value, i);
    } else {
      if (pos !== i) {
        this.moveSlot(pos, i);
      }
      this.slots[i].update(value);
    }
  }

  findMatch(input, i) {
    for (; i < this.slots.length; ++i) {
      if (this.slots[i].matches(input)) {
        return i;
      }
    }
    return -1;
  }

  getSlotNode(pos) {
    return pos >= this.slots.length ? this.next : this.slots[pos].start;
  }

  insertSlot(value, pos) {
    this.slots.splice(pos, 0, createSlot(value, this.getSlotNode(pos)));
  }

  moveSlot(from, to) {
    // Assert: from > to
    let slot = this.slots[from];
    let next = this.getSlotNode(to);
    this.slots.splice(from, 1);
    this.slots.splice(to, 0, slot);
    dom.insertSiblings(slot.start, slot.end, next);
  }

  removeSlots(from) {
    if (from >= this.slots.length) {
      return;
    }
    for (let i = from; i < this.slots.length; ++i) {
      this.slots[i].cancelUpdates();
    }
    let first = this.slots[from].start;
    let last = this.slots[this.slots.length - 1].end;
    dom.removeSiblings(first, last);
    this.slots.length = from;
  }
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

class TemplateSlot {
  constructor(template, next) {
    let fragment = dom.createFragment(next);
    this.updater = new TemplateUpdater(fragment);
    this.updater.update(template);
    this.start = dom.firstChild(fragment);
    this.end = dom.lastChild(fragment);
    if (!this.start) {
      this.start = this.end = dom.createText('', next);
      dom.insertBefore(this.start, next);
    } else {
      dom.insertBefore(fragment, next);
    }
  }

  cancelUpdates() {
    this.updater.cancelUpdates();
  }

  matches(value) {
    return (
      value instanceof TemplateResult &&
      value.source === this.updater.source
    );
  }

  update(template) {
    // Assert: template.source === this.updater.source
    this.updater.update(template);
  }
}

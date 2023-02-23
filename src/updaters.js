import { createSlot, updateSlot } from './slots.js';

import * as dom from './dom.js';

function toAttributeValue(value) {
  if (typeof value === 'object' && value) {
    if (Array.isArray(value)) {
      return value.join(' ');
    }
    if (value[Symbol.iterator]) {
      return Array.from(value).join(' ');
    }
    throw new TypeError('Invalid attribute value');
  }
  return value;
}

export class CommentUpdater {
  update() {
    // Empty
  }
}

export class AttributeUpdater {
  constructor(node, name) {
    this.node = node;
    this.name = name;
    this.last = undefined;
  }

  update(value) {
    let attrValue = toAttributeValue(value);
    if (attrValue !== this.last) {
      this.last = attrValue;
      dom.setAttr(this.node, this.name, attrValue);
    }
  }
}

export class AttributePartUpdater {
  constructor(node, name, parts, pos) {
    this.node = node;
    this.name = name;
    this.parts = parts;
    this.pos = pos;
    parts.pending[pos] = true;
  }

  isReady() {
    let pending = this.parts.pending;
    if (!pending) {
      return true;
    }
    pending[this.pos] = false;
    if (pending.every(p => !p)) {
      this.parts.pending = null;
      return true;
    }
    return false;
  }

  update(value) {
    this.parts[this.pos] = toAttributeValue(value);
    if (this.isReady()) {
      dom.setAttr(this.node, this.name, this.parts.join(''));
    }
  }
}

export class PropertyMapUpdater {
  constructor(node) {
    this.node = node;
  }

  update(map) {
    if (typeof map === 'function') {
      map = map(this.node);
    }
    if (map === undefined || map === null) {
      return;
    }
    if (typeof map !== 'object') {
      throw new Error('Invalid property map value');
    }
    Object.assign(this.node, map);
  }
}

export class ChildUpdater {
  constructor(context, parent, next) {
    this.slot = createSlot(context, parent, next, null);
  }

  update(value) {
    this.slot = updateSlot(this.slot, value);
  }
}

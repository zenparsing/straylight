import { createSlot, updateSlot } from './slots.js';

import * as dom from './dom.js';

function isObjectLike(value) {
  return value && (typeof value === 'function' || typeof value === 'object');
}

function toAttributeValue(value) {
  if (!isObjectLike(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  if (value[Symbol.iterator]) {
    return Array.from(value).join(' ');
  }
  throw new TypeError('Invalid attribute value');
}

function setPropertyOrAttribute(elem, name, value) {
  if (name in elem) {
    elem[name] = value;
  } else {
    dom.setAttr(elem, name, toAttributeValue(value));
  }
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
    if (value !== this.last) {
      this.last = value;
      setPropertyOrAttribute(this.node, this.name, value);
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
      setPropertyOrAttribute(this.node, this.name, this.parts.join(''));
    }
  }
}

export class AttributeMapUpdater {
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
    for (let [key, value] of Object.entries(map)) {
      setPropertyOrAttribute(this.node, key, value);
    }
  }
}

export class ChildUpdater {
  constructor(parent, next) {
    this.slot = createSlot(parent, next, null);
  }

  update(value) {
    this.slot = updateSlot(this.slot, value);
  }
}

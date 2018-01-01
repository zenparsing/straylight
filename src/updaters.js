import { createSlot, removeSlot } from './slots.js';
import * as dom from './dom.js';

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
      dom.setAttr(this.node, this.name, value);
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
    this.parts[this.pos] = value;
    if (this.isReady()) {
      dom.setAttr(this.node, this.name, this.parts.join(''));
    }
  }
}

export class AttributeMapUpdater {
  constructor(node) {
    this.node = node;
  }

  update(map) {
    for (let key in map) {
      dom.setAttr(this.node, key, map[key]);
    }
  }
}

export class ChildUpdater {
  constructor(parent, next) {
    this.parent = parent;
    this.slot = createSlot('', parent, next);
  }

  update(value) {
    if (this.slot.matches(value)) {
      this.slot.update(value);
    } else {
      let slot = this.slot;
      this.slot = createSlot(value, this.parent, slot.start);
      removeSlot(slot);
    }
  }
}

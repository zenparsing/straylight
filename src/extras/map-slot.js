import * as dom from '../dom.js';
import { createSlot, removeSlot } from '../slots.js';
import { symbols } from '../symbols.js';

export function withKeys(map) {
  return new MapSlotValue(map);
}

class MapSlotValue {
  constructor(pairs) { this.pairs = pairs; }
  [symbols.createSlot](parent, next) { return new MapSlot(this, parent, next); }
}

class SlotList {
  constructor(key, slot) {
    this.key = key;
    this.slot = slot;
    this.next = this;
    this.previous = this;
    this.end = true;
  }

  moveBefore(next) {
    let previous = next.previous;
    previous.next = this;
    next.previous = this;
    this.previous = previous;
    this.next = next;
    this.end = false;
  }
}

class MapSlot {
  constructor(value, parent, next) {
    this.parent = parent;
    this.keys = new Map();
    this.list = new SlotList(null, createSlot('', next));
    this.update(value);
  }

  get start() {
    return this.list.next.slot.start;
  }

  get end() {
    return this.list.previous.slot.end;
  }

  cancelUpdates() {
    for (let item = this.list.next; !item.end; item = item.next) {
      item.slot.cancelUpdates();
    }
  }

  matches(value) {
    return value instanceof MapSlotValue;
  }

  updateItem(key, value, next) {
    let item = this.map.get(key);
    if (item && !item.slot.matches(value)) {
      removeSlot(item.slot);
      item = null;
    }
    if (item) {
      item.update(value);
      if (item === next) {
        next = next.next;
      } else {
        dom.insertSiblings(item.slot.start, item.slot.end, next.slot.start);
        item.moveBefore(next);
      }
    } else {
      item = new SlotList(key, createSlot(value, this.parent, next.slot.start));
      item.moveBefore(next);
      this.map.set(key, item);
    }
    return next;
  }

  update(value) {
    let next = this.list.next;
    if (value.map instanceof Map) {
      value.map.forEach((value, key) => next = this.updateItem(key, value, next));
    } else {
      value.map.forEach(pair => next = this.updateItem(pair[0], pair[1], next));
    }
    while (!next.end) {
      removeSlot(next.slot);
      this.map.delete(next.key);
      next = next.next;
    }
  }
}

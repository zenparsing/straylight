import { createSlot, removeSlot } from '../slots.js';

import * as symbols from '../symbols.js';
import * as dom from '../dom.js';

export class MapSlotValue {
  constructor(map) {
    this.map = map instanceof Map ? map : new Map(map);
  }

  [symbols.createSlot](context, parent, next) {
    return new MapSlot(context, parent, next, this);
  }
}

class MapSlotList {
  constructor(slot, key) {
    this.slot = slot;
    this.key = key;
    this.next = this;
    this.previous = this;
    this.end = true;
  }

  insertBefore(next) {
    this.remove();
    let previous = next.previous;
    previous.next = this;
    next.previous = this;
    this.previous = previous;
    this.next = next;
    this.end = false;
  }

  remove() {
    this.next.previous = this.previous;
    this.previous.next = this.next;
    this.next = this;
    this.previous = this;
    this.end = true;
  }
}

export class MapSlot {
  constructor(context, parent, next, value) {
    this.context = context;
    this.parent = parent;
    this.map = new Map();
    this.list = new MapSlotList(createSlot(this.context, parent, next), null);
    this.update(value);
  }

  get start() {
    return this.list.next.slot.start;
  }

  get end() {
    return this.list.slot.end;
  }

  cancelUpdates() {
    for (let item = this.list.next; !item.end; item = item.next) {
      item.slot.cancelUpdates();
    }
  }

  matches(value) {
    return value instanceof MapSlotValue;
  }

  update(value) {
    let valueMap = value.map;
    let next = this.list.next;
    valueMap.forEach((value, key) => {
      while (!next.end && !valueMap.has(next.key)) {
        next = this.removeItem(next);
      }
      next = this.updateItem(key, value, next);
    });
    while (!next.end) {
      next = this.removeItem(next);
    }
  }

  updateItem(key, value, next) {
    let item = this.map.get(key);
    if (item && item.slot.matches(value)) {
      item.slot.update(value);
      if (item === next) {
        next = next.next;
      } else {
        dom.insertSiblings(item.slot.start, item.slot.end, next.slot.start);
        item.insertBefore(next);
      }
    } else {
      let slot = createSlot(this.context, this.parent, next.slot.start, value);
      item = new MapSlotList(slot, key);
      item.insertBefore(next);
      this.map.set(key, item);
    }
    return next;
  }

  removeItem(item) {
    let next = item.next;
    item.remove();
    this.map.delete(item.key);
    removeSlot(item.slot);
    return next;
  }
}

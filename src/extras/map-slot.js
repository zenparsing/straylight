import * as dom from '../dom.js';
import { createSlot, removeSlot } from '../slots.js';
import { symbols } from '../symbols.js';

// IE11 does not support argument to Map constructor
const supportsMapArg = (new Map([[1, 1]]).size > 0);

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
  constructor(parent, next) {
    this.parent = parent;
    this.map = new Map();
    this.list = new MapSlotList(createSlot(parent, next), null);
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
    return value && value[symbols.slotConstructor] === this.constructor;
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
      let slot = createSlot(this.parent, next.slot.start, value);
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

  static value(map) {
    if (!(map instanceof Map)) {
      if (supportsMapArg) {
        map = new Map(map);
      } else {
        // IE11
        let list = map;
        map = new Map();
        list.forEach(pair => map.set(pair[0], pair[1]));
      }
    }
    return { map, [symbols.slotConstructor]: this };
  }
}

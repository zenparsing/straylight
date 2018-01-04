import { ListSlot } from '../slots.js';
import { symbols } from '../symbols.js';

// IE11 does not support argument to Map constructor
const supportsMapArg = (new Map([[1, 1]]).size > 0);

function toMap(value) {
  if (value instanceof Map) {
    return value;
  }
  if (!supportsMapArg) {
    // IE11
    let map = new Map();
    value.forEach(pair => map.set(pair[0], pair[1]));
    return map;
  }
  return new Map(value);
}

export function withKeys(map) {
  return MapSlot.value(map);
}

class MapSlot extends ListSlot {
  constructor(parent, next) {
    super(parent, next);
    this.map = new Map();
  }

  matches(value) {
    return value && value[symbols.slotConstructor] === this.constructor;
  }

  update(value) {
    let valueMap = value.map;
    let next = this.list.next;
    valueMap.forEach((value, key) => {
      while (!next.end && !valueMap.has(next.key)) {
        this.map.delete(next.key);
        next = this.removeItem(next);
      }
      next = this.updateItem(key, value, next);
    });
    while (!next.end) {
      this.map.delete(next.key);
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
        this.moveItem(item, next);
      }
    } else {
      item = this.createItem(value, next);
      item.key = key;
      this.map.set(key, item);
    }
    return next;
  }

  static value(map) {
    return { map: toMap(map), [symbols.slotConstructor]: this };
  }
}

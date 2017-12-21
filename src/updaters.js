import { symbols } from './symbols.js';
import { Actions } from './actions.js';
import { createSlot } from './slots.js';
import * as dom from './dom.js';

export class TemplateUpdater {
  constructor(target) {
    this.target = target;
    this.updaters = null;
    this.pending = [];
    this.source = null;
  }

  cancelUpdates() {
    if (this.updaters) {
      for (let i = 0; i < this.updaters.length; ++i) {
        this.cancelPending(i);
        let updater = this.updaters[i];
        if (updater instanceof ChildUpdater) {
          updater.cancelUpdates();
        }
      }
    }
  }

  pendingSource(i) {
    return this.pending[i] && this.pending[i].source;
  }

  cancelPending(i) {
    let pending = this.pending[i];
    if (pending) {
      this.pending[i] = null;
      pending.cancel();
    }
  }

  setPending(pending, i) {
    this.cancelPending(i);
    this.pending[i] = pending;
  }

  awaitPromise(value, i) {
    if (this.pendingSource(i) === value) {
      return;
    }

    let pending = {
      source: value,
      cancelled: false,
      cancel() { this.cancelled = true; },
    };

    value.then(val => {
      if (!pending.cancelled) {
        this.pending[i] = null;
        this.updaters[i].update(val);
      }
    }, err => {
      if (!pending.cancelled) {
        this.pending[i] = null;
      }
      throw err;
    });

    this.setPending(pending, i);
  }

  awaitObservable(value, i) {
    if (this.pendingSource(i) === value) {
      return;
    }

    let subscription = value[symbols.observable]().subscribe(
      val => this.updaters[i].update(val),
      err => { this.updaters[i] = null; throw err; },
      () => this.updaters[i] = null,
    );

    if (!subscription.closed) {
      this.setPending({
        source: value,
        cancel() { subscription.unsubscribe(); },
      }, i);
    }
  }

  awaitAsyncIterator(value, i) {
    if (this.pendingSource(i) === value) {
      return;
    }

    let iter = value[symbols.asyncIterator]();

    let next = () => {
      iter.next().then(result => {
        if (!pending.cancelled) {
          if (result.done) {
            this.updaters[i] = null;
          } else {
            this.updaters[i].update(result.value);
            next();
          }
        }
      }, err => {
        if (!pending.cancelled) {
          this.pending[i] = null;
        }
        throw err;
      });
    };

    let pending = {
      source: value,
      cancelled: false,
      cancel() { this.cancelled = true; iter.return(); },
    };

    next();
    this.setPending(pending, i);
  }

  update(template) {
    if (!this.updaters || this.source !== template.source) {
      this.cancelUpdates();
      this.updaters = template.evaluate(new Actions(this.target));
      this.pending = Array(this.updaters.length);
      this.source = template.source;
    }
    let values = template.values;
    for (let i = 0; i < this.updaters.length; ++i) {
      let value = i < values.length ? values[i] : null;
      if (value && typeof value.then === 'function') {
        this.awaitPromise(value, i);
      } else if (value && value[symbols.observable]) {
        this.awaitObservable(value, i);
      } else if (value && value[symbols.asyncIterator]) {
        this.awaitAsyncIterator(value, i);
      } else {
        this.cancelPending(i);
        this.updaters[i].update(value);
      }
    }
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
    if (!parts.pending) {
      parts.pending = new Set();
    }
    parts.pending.add(pos);
  }

  update(value) {
    this.parts[this.pos] = value;
    let pending = this.parts.pending;
    if (pending) {
      pending.delete(this.pos);
      if (pending.size === 0) {
        this.parts.pending = null;
        pending = null;
      }
    }
    if (!pending) {
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
  constructor(marker) {
    this.marker = marker;
    this.slot = null;
    this.slots = null;
  }

  update(value) {
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return this.updateVector(value);
      }
      if (value && value[symbols.iterator]) {
        return this.updateVector(value, true);
      }
    }
    if (this.slots) {
      this.updateVector([value]);
      this.toScalar();
    } else {
      this.updateScalar(value);
    }
  }

  cancelUpdates() {
    if (this.slots) {
      for (let i = 0; i < this.slots.length; ++i) {
        this.cancelSlotUpdates(this.slots[i]);
      }
    } else if (this.slot) {
      this.cancelSlotUpdates(this.slot);
    }
  }

  cancelSlotUpdates(slot) {
    if (slot.cancelUpdates) {
      slot.cancelUpdates();
    }
  }

  toScalar() {
    if (this.slots) {
      this.slot = this.slots.length > 0 ? this.slots[0] : null;
      this.removeSlots(1);
      this.slots = null;
    }
  }

  toVector() {
    if (!this.slots) {
      this.slots = this.slot ? [this.slot] : [];
      this.slot = null;
    }
  }

  // Scalar operations

  updateScalar(value) {
    if (!this.slot) {
      this.slot = createSlot(value, this.marker);
    } else if (this.slot.matches(value)) {
      this.slot.update(value);
    } else {
      this.slot.cancelUpdates();
      dom.removeSiblings(this.slot.start, this.slot.end);
      this.slot = createSlot(value, this.marker);
    }
  }

  // Vector operations

  updateVector(list, iterable) {
    this.toVector();
    let i = 0;
    if (iterable) {
      for (let item of list) {
        this.updateVectorItem(item, i++);
      }
    } else {
      while (i < list.length) {
        this.updateVectorItem(list[i], i++);
      }
    }
    if (i < this.slots.length) {
      this.removeSlots(i);
    }
  }

  updateVectorItem(value, i) {
    let pos = this.search(value, i);
    if (pos === -1) {
      this.insertSlot(value, i);
    } else {
      if (pos !== i) {
        this.moveSlot(pos, i);
      }
      this.slots[i].update(value);
    }
  }

  search(input, i) {
    // TODO: O(1) key searching
    if (i < this.slots.length && this.slots[i].matches(input)) {
      return i;
    }
    return -1;
  }

  getSlotNode(pos) {
    return pos >= this.slots.length ? this.marker : this.slots[pos].start;
  }

  insertSlot(value, pos) {
    this.slots.splice(pos, 0, createSlot(value, this.getSlotNode(pos)));
  }

  moveSlot(from, to) {
    let slot = this.slots[from];
    dom.insertSiblings(slot.start, slot.end, this.getSlotNode(to));
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

import { TemplateResult } from 'htmltag';
import { Actions } from './actions.js';
import { symbols } from './symbols.js';
import * as dom from './dom.js';

export function createSlot(parent, next, value) {
  let ctor = getSlotConstructor(value);
  let slot = new ctor(parent, next, value);
  slot.update(value);
  return slot;
}

export function removeSlot(slot) {
  slot.cancelUpdates();
  dom.removeSiblings(slot.start, slot.end);
}

function getSlotConstructor(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return TextSlot;
  }

  if (value[symbols.slotConstructor]) {
    return value[symbols.slotConstructor];
  }

  if (isIterable(value)) {
    return ListSlot;
  }

  if (value instanceof TemplateResult) {
    return TemplateSlot;
  }

  throw new TypeError('Invalid child slot value');
}

function isIterable(value) {
  return (
    Array.isArray(value) ||
    value && typeof value !== 'string' && value[symbols.iterator]
  );
}

class ListSlotItem {
  constructor(slot) {
    this.slot = slot;
    this.next = this;
    this.previous = this;
    this.end = true;
  }

  insertBefore(next) {
    if (this !== next) {
      this.remove();
      let previous = next.previous;
      previous.next = this;
      next.previous = this;
      this.previous = previous;
      this.next = next;
      this.end = false;
    }
  }

  remove() {
    this.next.previous = this.previous;
    this.previous.next = this.next;
    this.next = this;
    this.previous = this;
    this.end = true;
  }
}

export class ListSlot {
  constructor(parent, next) {
    this.parent = parent;
    this.list = new ListSlotItem(createSlot(parent, next));
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
    return isIterable(value);
  }

  update(list) {
    let next = this.list.next;
    if (Array.isArray(list)) {
      // IE11
      for (let i = 0; i < list.length; ++i) {
        next = this.updateItem(list[i], next);
      }
    } else {
      for (let item of list) {
        next = this.updateItem(item, next);
      }
    }
    while (!next.end) {
      next = this.removeItem(next);
    }
  }

  updateItem(value, next) {
    let item = next;
    for (; !item.end; item = item.next) {
      if (item.slot.matches(value)) {
        break;
      }
    }
    if (!item.end) {
      item.slot.update(value);
      next = this.moveItem(item, next);
    } else {
      this.createItem(value, next);
    }
    return next;
  }

  createItem(value, next) {
    let item = new ListSlotItem(createSlot(this.parent, next.slot.start, value));
    item.insertBefore(next);
    return item;
  }

  moveItem(item, next) {
    item.insertBefore(next);
    if (item === next) {
      return item.next;
    }
    dom.insertSiblings(item.slot.start, item.slot.end, next.slot.start);
    return next;
  }

  removeItem(item) {
    let next = item.next;
    item.remove();
    removeSlot(item.slot);
    return next;
  }
}

class TextSlot {
  constructor(parent, next, value) {
    let node = dom.createText(value, parent);
    dom.insertChild(node, parent, next);
    this.start = node;
    this.end = node;
    this.last = value;
  }

  cancelUpdates() {
    // Empty
  }

  matches(value) {
    return value === null || typeof value !== 'object';
  }

  update(value) {
    if (value !== this.last) {
      this.last = value;
      dom.setTextValue(this.start, value);
    }
  }
}

class TemplateSlot {
  constructor(parent, next, template) {
    // The first and last nodes of the template could be dynamic,
    // so create stable marker nodes before and after the content
    this.start = dom.insertMarker(parent, next);
    this.end = dom.insertMarker(parent, next);
    this.source = template.source;
    this.updaters = template.evaluate(new Actions(parent, this.end));
    this.pending = Array(this.updaters.length);
  }

  cancelUpdates() {
    for (let i = 0; i < this.updaters.length; ++i) {
      this.cancelPending(i);
      let updater = this.updaters[i];
      if (updater.slot) {
        updater.slot.cancelUpdates();
      }
    }
  }

  matches(value) {
    return (
      value instanceof TemplateResult &&
      value.source === this.source
    );
  }

  update(template) {
    // Assert: template.source === this.updater.source
    let values = template.values;
    for (let i = 0; i < this.updaters.length; ++i) {
      let value = values[i];
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
      err => { this.pending[i] = null; throw err; },
      () => this.pending[i] = null,
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
            this.pending[i] = null;
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
      cancel() {
        this.cancelled = true;
        if (typeof iter.return === 'function') {
          iter.return();
        }
      },
    };

    next();
    this.setPending(pending, i);
  }
}

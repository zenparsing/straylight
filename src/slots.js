import { TemplateResult } from 'htmltag';
import { Actions } from './actions.js';
import { symbols } from './symbols.js';
import * as dom from './dom.js';

export function createSlot(value, parent, next) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return new TextSlot(value, parent, next);
  }

  if (value[symbols.createSlot]) {
    return value[symbols.createSlot](parent, next);
  }

  if (isIterable(value)) {
    return new ArraySlot(value, parent, next);
  }

  if (value instanceof TemplateResult) {
    return new TemplateSlot(value, parent, next);
  }

  throw new TypeError('Invalid child slot value');
}

export function removeSlot(slot) {
  slot.cancelUpdates();
  dom.removeSiblings(slot.start, slot.end);
}

function isIterable(value) {
  return (
    Array.isArray(value) ||
    value && typeof value !== 'string' && value[symbols.iterator]
  );
}

class ArraySlot {
  constructor(value, parent, next) {
    this.parent = parent;
    this.end = dom.insertMarker(parent, next);
    this.slots = [];
    this.update(value);
  }

  get start() {
    return this.slots.length > 0 ? this.slots[0].start : this.end;
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
    let length = i;
    while (i < this.slots.length) {
      removeSlot(this.slots[i++]);
    }
    this.slots.length = length;
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

  insertSlot(value, pos) {
    let next = pos >= this.slots.length ? this.end : this.slots[pos].start;
    let slot = createSlot(value, this.parent, next);
    this.slots.splice(pos, 0, slot);
  }

  moveSlot(from, to) {
    // Assert: from > to
    let slot = this.slots[from];
    let next = this.slots[to].start;
    this.slots.splice(from, 1);
    this.slots.splice(to, 0, slot);
    dom.insertSiblings(slot.start, slot.end, next);
  }
}

function convertToString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
}

class TextSlot {
  constructor(value, parent, next) {
    value = convertToString(value);
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
    value = convertToString(value);
    if (value !== this.last) {
      this.last = value;
      dom.setTextValue(this.start, value);
    }
  }
}

class TemplateSlot {
  constructor(template, parent, next) {
    // The first and last nodes of the template could be dynamic,
    // so create stable marker nodes before and after the content
    this.start = dom.insertMarker(parent, next);
    this.end = dom.insertMarker(parent, next);
    this.source = template.source;
    this.updaters = template.evaluate(new Actions(parent, this.end));
    this.pending = Array(this.updaters.length);
    this.update(template);
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

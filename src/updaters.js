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
    this.key = '';
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

  update(template) {
    if (!this.updaters || this.source !== template.source) {
      this.cancelUpdates();
      this.updaters = template.evaluate(new Actions(this.target));
      this.pending = Array(this.updaters.length);
      this.source = template.source;
    }
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
  constructor(marker) {
    dom.insertBefore(dom.createText('', marker), marker);
    this.marker = marker;
    this.slot = null;
  }

  update(value) {
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

  cancelUpdates() {
    if (this.slot) {
      this.slot.cancelUpdates();
    }
  }
}

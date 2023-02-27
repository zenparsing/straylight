import { TemplateResult } from 'htmltag';
import { Actions } from './actions.js';

import * as dom from './dom.js';

export const createSlotSymbol = Symbol('createSlot');

const contextSymbol = Symbol('context');

export function createSlot(context, parent, next, value) {
  if (isTextLike(value)) {
    return new TextSlot(context, parent, next, value);
  }

  if (typeof value[createSlotSymbol] === 'function') {
    return value[createSlotSymbol](context, parent, next);
  }

  if (value instanceof TemplateResult) {
    return new TemplateSlot(context, parent, next, value);
  }

  if (isIterable(value)) {
    return new MapSlot(context, parent, next, value);
  }

  throw new TypeError('Invalid child slot value');
}

export function updateSlot(slot, value) {
  if (slot.matches(value)) {
    slot.update(value);
    return slot;
  }
  let next = slot.start;
  let newSlot = createSlot(slot.context, dom.parent(next), next, value);
  removeSlot(slot);
  return newSlot;
}

export function removeSlot(slot) {
  slot.cancelUpdates();
  dom.removeSiblings(slot.start, slot.end);
}

export function withKey(key, value) {
  return new KeyedValue(key, value);
}

function isTextLike(value) {
  return value === null || (
    typeof value !== 'function' &&
    typeof value !== 'object'
  );
}

function isIterable(value) {
  return (
    Array.isArray(value) ||
    value && typeof value !== 'string' && value[Symbol.iterator]
  );
}

class TextSlot {
  constructor(context, parent, next, value) {
    let node = dom.createText(value, parent);
    dom.insertChild(node, parent, next);
    this.context = context;
    this.start = node;
    this.end = node;
    this.last = value;
  }

  cancelUpdates() {
    // Empty
  }

  matches(value) {
    return isTextLike(value);
  }

  update(value) {
    if (value !== this.last) {
      this.last = value;
      dom.setTextValue(this.start, value);
    }
  }
}

class KeyedValue {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

function convertValueToMap(value) {
  if (value instanceof Map) {
    return value;
  }
  let map = new Map();
  let i = 0;
  for (let item of value) {
    if (item instanceof KeyedValue) {
      map.set(item.key, item.value);
    } else {
      map.set('wyxOoLpzQhihTM6QZ83HVA0:' + i, item);
    }
    i++;
  }
  return map;
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

class MapSlot {
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
    return isIterable(value);
  }

  update(value) {
    let map = convertValueToMap(value);
    let next = this.list.next;
    map.forEach((value, key) => {
      while (!next.end && !map.has(next.key)) {
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

class TemplateSlot {
  constructor(context, parent, next, template) {
    this.context = context;
    // The first and last nodes of the template could be dynamic,
    // so create stable marker nodes before and after the content.
    this.start = dom.insertMarker(parent, next);
    this.end = dom.insertMarker(parent, next);
    this.source = template.source;
    this.updaters = template.evaluate(new Actions(context, parent, this.end));
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
    let { values } = template;
    for (let i = 0; i < this.updaters.length; ++i) {
      let value = values[i];
      if (value && value[Symbol.asyncIterator]) {
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

  awaitAsyncIterator(value, i) {
    if (this.pendingSource(i) === value) {
      return;
    }

    let iter = value[Symbol.asyncIterator]();

    let next = () => {
      iter.next().then(result => {
        if (!pending.cancelled) {
          if (result.done) {
            this.pending[i] = null;
          } else {
            try {
              this.updaters[i].update(result.value);
            } catch (err) {
              this.cancelPending(i);
              throw err;
            }
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

export class Component {
  constructor() {
    this[contextSymbol] = null;
  }

  createContext() {
    return null;
  }

  render() {
    return null;
  }

  useContext(contextProvider = this.constructor) {
    if (!contextProvider) {
      return null;
    }
    for (
      let context = this[contextSymbol];
      context;
      context = context.parent
    ) {
      if (context.provider === contextProvider) {
        return context.value;
      }
    }
    let { defaultContext } = contextProvider;
    if (defaultContext === undefined) {
      defaultContext = null;
    }
    return defaultContext;
  }

  [createSlotSymbol](context, parent, next) {
    return new ComponentSlot(context, parent, next, this);
  }
}

class ComponentSlot {
  constructor(context, parent, next, component) {
    this.context = context;
    this.childContext = context;
    this.contextProvider = component.constructor;

    let contextValue = component.createContext();
    if (contextValue !== null && contextValue !== undefined) {
      this.childContext = {
        provider: this.contextProvider,
        parent: context,
        value: contextValue,
      };
    }

    component[contextSymbol] = this.childContext;
    this.slot = createSlot(this.childContext, parent, next, component.render());
  }

  get start() {
    return this.slot.start;
  }

  get end() {
    return this.slot.end;
  }

  cancelUpdates() {
    this.slot.cancelUpdates();
  }

  matches(value) {
    return value && value.constructor === this.contextProvider;
  }

  update(component) {
    component[contextSymbol] = this.childContext;
    this.slot = updateSlot(this.slot, component.render());
  }
}

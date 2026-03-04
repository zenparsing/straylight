import { TemplateResult } from 'htmltag';
import * as dom from './dom.js';
import * as recycler from './recycler.js';

// ## Template Slots

export const createSlotSymbol = Symbol('createSlot');

export function createSlot(parent, next, value) {
  if (isTextLike(value)) {
    return new TextSlot(parent, next, value);
  }

  if (value instanceof TemplateResult) {
    return new TemplateSlot(parent, next, value);
  }

  if (typeof value[createSlotSymbol] === 'function') {
    return value[createSlotSymbol](parent, next);
  }

  if (isIterable(value)) {
    return new ListSlot(parent, next, value);
  }

  throw new TypeError('Invalid child slot value');
}

export function updateSlot(slot, value) {
  if (slot.matches(value)) {
    slot.update(value);
    return slot;
  }
  let parent = dom.parent(slot.start);
  let next = dom.nextSibling(slot.end);
  removeSlot(slot);
  return createSlot(parent, next, value);
}

export function removeSlot(slot) {
  slot.cancelUpdates();
  dom.removeSiblings(slot.start, slot.end);
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
    return isTextLike(value);
  }

  update(value) {
    if (value !== this.last) {
      this.last = value;
      dom.setTextValue(this.start, value);
    }
  }
}

class ListSlot {
  constructor(parent, next, value) {
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
    for (let item of list) {
      this.updateItem(item, i++);
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
    let slot = createSlot(dom.parent(next), next, value);
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

class TemplateSlot {
  constructor(parent, next, value) {
    // The first and last nodes of the template could be dynamic, so create
    // stable marker nodes before and after the content.
    this.start = dom.insertMarker(parent, next);
    this.end = dom.insertMarker(parent, next);
    this.template = value.template;

    let fragment = dom.createFragment(parent);
    this.updaters = buildTemplate(this.template, fragment, null, parent);
    this.pending = Array(this.updaters.length);

    this.update(value);
    dom.insertChild(fragment, parent, this.end);
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
      value.template === this.template
    );
  }

  update(value) {
    // Assert: value.template === this.template
    let { values } = value;
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

// ## Slot Updaters

function isObjectLike(value) {
  return value && (typeof value === 'function' || typeof value === 'object');
}

function toAttributeValue(name, value) {
  if (!isObjectLike(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  if (value[Symbol.iterator]) {
    return Array.from(value).join(' ');
  }
  throw new TypeError(`Invalid value for attribute ${name}`);
}

function setPropertyOrAttribute(elem, name, value) {
  if (name in elem) {
    elem[name] = value;
  } else {
    dom.setAttr(elem, name, toAttributeValue(name, value));
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
      setPropertyOrAttribute(this.node, this.name, value);
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
    this.parts[this.pos] = toAttributeValue(this.name, value);
    if (this.isReady()) {
      setPropertyOrAttribute(this.node, this.name, this.parts.join(''));
    }
  }
}

export class AttributeMapUpdater {
  constructor(node) {
    this.node = node;
  }

  update(map) {
    if (typeof map === 'function') {
      map = map(this.node);
    }
    if (map === undefined || map === null) {
      return;
    }
    if (typeof map !== 'object') {
      throw new Error('Invalid property map value');
    }
    for (let [key, value] of Object.entries(map)) {
      setPropertyOrAttribute(this.node, key, value);
    }
  }
}

export class ChildUpdater {
  constructor(parent, next) {
    this.slot = createSlot(parent, next, null);
  }

  update(value) {
    this.slot = updateSlot(this.slot, value);
  }
}

// ## Tree Builder

function getKey(node) {
  let attr = node.attributes.find((attr) => (
    attr.kind === 'static' && attr.name === 'data-key'
  ));
  return attr ? attr.value : '';
}

class Builder {
  constructor() {
    this.updaters = null;
  }

  build(template, parent, next, context) {
    this.updaters = [];
    this.buildNode(template, parent, next, context);
    return this.updaters;
  }

  addAttributePartUpdater(element, name, parts) {
    let updaterParts = [parts[0]];
    updaterParts.pending = [];
    for (let i = 1; i < parts.length; ++i) {
      let pos = updaterParts.length;
      updaterParts.push('');
      updaterParts.push(parts[i]);
      let updater = new AttributePartUpdater(element, name, updaterParts, pos);
      this.updaters.push(updater);
    }
  }

  buildNode(node, parent, next, context) {
    switch (node.kind) {
      case 'root':
        this.buildChildren(node, parent, next, context);
        return;
      case 'child-slot':
        this.updaters.push(new ChildUpdater(parent, next));
        return;
      case 'null-slot':
        this.updaters.push(new CommentUpdater());
        return;
    }

    let elem = null;
    let key = getKey(node);

    if (key) {
      elem = recycler.get(key, node.tag);
      if (elem) {
        dom.removeChildren(elem);
      }
    }

    if (!elem) {
      elem = dom.createElement(node.tag, context);
    }

    if (key) {
      recycler.add(key, elem);
    }

    for (let attr of node.attributes) {
      switch (attr.kind) {
        case 'static':
          if (attr.name in elem) {
            elem[attr.name] = attr.value;
          } else {
            dom.setAttr(elem, attr.name, attr.value);
          }
          break;
        case 'value':
          this.updaters.push(new AttributeUpdater(elem, attr.name));
          break;
        case 'map':
          this.updaters.push(new AttributeMapUpdater(elem));
          break;
        case 'null':
          this.updaters.push(new CommentUpdater());
          break;
        case 'parts':
          this.addAttributePartUpdater(elem, attr.name, attr.value);
          break;
      }
    }

    this.buildChildren(node, elem, null, elem);
    dom.insertChild(elem, parent, next);
  }

  buildChildren(node, parent, next, context) {
    for (let child of node.children) {
      if (typeof child === 'string') {
        let text = dom.createText(child, context);
        dom.insertChild(text, parent, next);
      } else {
        this.buildNode(child, parent, next, context);
      }
    }
  }
}

function buildTemplate(template, parent, next, context) {
  return new Builder().build(template, parent, next, context);
}

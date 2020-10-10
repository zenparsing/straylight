import * as dom from './dom.js';

import {
  CommentUpdater,
  AttributeUpdater,
  AttributePartUpdater,
  PropertyMapUpdater,
  ChildUpdater } from './updaters.js';

class Dynamic {
  constructor(value) { this.value = value; }
}

function isDynamic(x) {
  return x instanceof Dynamic;
}

export class Actions {
  constructor(parent, next) {
    this.parent = parent;
    this.next = next;
    this.updaters = [];
  }

  createRoot() {
    return this.parent;
  }

  finishRoot() {
    return this.updaters;
  }

  createElement(tag, parent) {
    // Dynamic tags throw
    if (typeof tag !== 'string') {
      throw new TypeError('Tag name must be a string');
    }
    return dom.createElement(tag, parent);
  }

  createComment(value) {
    if (isDynamic(value)) {
      this.updaters.push(new CommentUpdater());
    }
    return null;
  }

  finishElement(node) {
    return node;
  }

  appendChild(node, child) {
    let next = node === this.parent ? this.next : null;
    if (isDynamic(child)) {
      this.updaters.push(new ChildUpdater(node, next));
    } else if (child !== null) {
      if (typeof child === 'string') {
        child = dom.createText(child, node);
      }
      dom.insertChild(child, node, next);
    }
  }

  mapValue(v) {
    return new Dynamic(v);
  }

  setAttribute(node, name, value) {
    if (isDynamic(value)) {
      // TODO: Should we update immediately as we build the
      // tree, so that attributes will be populated when the
      // element is connected? What about other kinds of
      // updaters?
      let updater = new AttributeUpdater(node, name);
      this.updaters.push(updater);
      updater.update(value.value);
    } else {
      dom.setAttr(node, name, value);
    }
  }

  setAttributes(node) {
    // Assert: value is Dynamic
    this.updaters.push(new PropertyMapUpdater(node));
  }

  setAttributeParts(node, name, parts) {
    // Assert: some part is Dynamic
    parts.pending = [];
    for (let i = 0; i < parts.length; ++i) {
      if (isDynamic(parts[i])) {
        this.updaters.push(new AttributePartUpdater(node, name, parts, i));
      }
    }
  }
}

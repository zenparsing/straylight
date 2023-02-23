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
  constructor(context, root, next) {
    this.context = context;
    this.root = root;
    this.next = next;
    this.updaters = [];
  }

  createRoot() {
    return this.root;
  }

  finishRoot() {
    return this.updaters;
  }

  createElement(tag, parent) {
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
    let next = node === this.root ? this.next : null;
    if (isDynamic(child)) {
      this.updaters.push(new ChildUpdater(this.context, node, next));
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
      this.updaters.push(new AttributeUpdater(node, name));
    } else {
      dom.setAttr(node, name, value);
    }
  }

  setAttributes(node) {
    this.updaters.push(new PropertyMapUpdater(node));
  }

  setAttributeParts(node, name, parts) {
    parts.pending = [];
    for (let i = 0; i < parts.length; ++i) {
      if (isDynamic(parts[i])) {
        this.updaters.push(new AttributePartUpdater(node, name, parts, i));
      }
    }
  }
}

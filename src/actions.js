import * as dom from './dom.js';

import {
  TagUpdater,
  CommentUpdater,
  AttributeUpdater,
  AttributeMapUpdater,
  AttributePartUpdater,
  ChildUpdater,
} from './updaters.js';

class Dynamic {
  constructor(value) {
    this.value = value;
  }
}

function isDynamic(x) {
  return x instanceof Dynamic;
}

export class Actions {
  constructor(target) {
    this.target = target;
    this.updaters = [];
  }

  createRoot() {
    return this.target;
  }

  finishRoot() {
    return this.updaters;
  }

  createNode(tag, parent) {
    if (isDynamic(tag)) {
      this.updaters.push(new TagUpdater(tag));
      tag = tag.value;
    }
    if (typeof tag !== 'string') {
      throw new TypeError('Tag name must be a string');
    }
    return dom.createElement(tag, parent);
  }

  finishNode(node) {
    return node;
  }

  addChild(node, child) {
    if (isDynamic(child)) {
      let marker = dom.createText('', node);
      dom.appendNode(marker, node);
      this.updaters.push(new ChildUpdater(marker));
    } else {
      if (typeof child === 'string') {
        child = dom.createText(child, node);
      }
      dom.appendNode(child, node);
    }
  }

  addComment(node, value) {
    if (isDynamic(value)) {
      this.updaters.push(new CommentUpdater());
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
    // Assert: attribute map is Dynamic
    this.updaters.push(new AttributeMapUpdater(node));
  }

  setAttributeParts(node, name, parts) {
    // Assert: some part is Dynamic
    for (let i = 0; i < parts.length; ++i) {
      if (isDynamic(parts[i])) {
        this.updaters.push(new AttributePartUpdater(node, name, parts, i));
      }
    }
  }
}

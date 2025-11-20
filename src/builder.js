import * as dom from './dom.js';

import {
  CommentUpdater,
  AttributeUpdater,
  AttributePartUpdater,
  AttributeMapUpdater,
  ChildUpdater } from './updaters.js';

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

    // TODO: Here we could pull in a keyed element from a node recycler.
    let elem = dom.createElement(node.tag, context);

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

export function buildTemplate(template, parent, next, context) {
  return new Builder().build(template, parent, next, context);
}

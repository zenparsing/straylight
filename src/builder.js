import * as dom from './dom.js';

import {
  CommentUpdater,
  AttributeUpdater,
  AttributePartUpdater,
  AttributeMapUpdater,
  ChildUpdater } from './updaters.js';

function getKey(node) {
  let attr = node.attributes.find((attr) => (
    attr.kind === 'static' && attr.name === 'data-key'
  ));
  return attr ? attr.value : '';
}

export class TreeBuilder {
  constructor(freeMap) {
    this.freeMap = freeMap;
    this.updaters = null;
    this.keyedElements = null;
  }

  build(template, parent, next, context) {
    this.updaters = [];
    this.keyedElements = new Map();
    this.buildNode(template, parent, next, context);
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

    if (key && this.freeMap) {
      elem = this.freeMap.get(key);
      if (elem) {
        dom.removeChildren(elem);
      }
    }

    if (!elem) {
      elem = dom.createElement(node.tag, context);
    }

    if (key) {
      this.keyedElements.set(key, elem);
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

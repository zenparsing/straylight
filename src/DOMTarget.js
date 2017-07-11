import { PushStream } from './PushStream.js';
import * as symbols from './symbols.js';

function patchNode(target, element) {
  if (typeof element.tag !== 'string') {
    throw new Error(`Invalid element tag ${element.tag}`);
  }

  if (element.tag === '#document-fragment') {
    throw new Error('Cannot patch a document fragment');
  }

  if (element.tag === '#text') {
    if (sameTagName(target, element)) {
      if (target.nodeValue !== element.props.text) {
        target.nodeValue = element.props.text;
      }
      return target;
    }
    return target.ownerDocument.createTextNode(element.props.text);
  }

  if (!sameTagName(target, element)) {
    target = target.ownerDocument.createElement(element.tag);
  }

  patchAttributes(target, element);
  let { updateChildren = true } = element.props;
  if (updateChildren) {
    patchChildren(target, element.children);
  }
  return target;
}

function patchAttributes(target, element) {
  let names = new Set();
  // Set attributes defined by the element
  Object.keys(element.props).forEach(key => {
    let name = propToAttributeName(key);
    if (!name) {
      return;
    }
    let value = element.props[key];
    let assignProp = shouldAssignProperty(target, name, value);
    let attrValue = assignProp ? '' : value;
    if ((value === null || value === undefined) && target.hasAttribute(name)) {
      target.removeAttribute(name);
    } else if (target.getAttribute(name) !== attrValue) {
      target.setAttribute(name, attrValue);
    }
    if (assignProp) {
      if (target[name] !== value) {
        target[name] = value;
      }
    }
    names.add(name);
  });
  // Remove attributes not defined by the element
  let { attributes } = target;
  for (let i = attributes.length - 1; i >= 0; --i) {
    let { name, specified } = attributes[i];
    if (!names.has(name)) {
      if (specified) {
        target.removeAttribute(name);
      }
      if (shouldAssignProperty(target, name)) {
        target[name] = undefined;
      }
    }
  }
}

function lifecycle(event, node, props) {
  if (event === 'created') {
    let updates = null;
    let observable = () => {
      if (!updates) {
        updates = node[symbols.targetUpdates] = new PushStream();
      }
      return updates.observable;
    };
    if (props.onTargetCreated) {
      props.onTargetCreated.call(undefined, new DOMTarget(node), observable());
    }
    if (props.onElementCreated) {
      props.onElementCreated.call(undefined, node, observable());
    }
  } else {
    let updates = node[symbols.targetUpdates];
    if (updates) {
      switch (event) {
        case 'updated':
          updates.push(props);
          break;
        case 'removed':
          updates.end();
          break;
      }
    }
  }
}

function patchChildren(target, children) {
  let noMatch = { ownerDocument: target.ownerDocument };
  let size = 0;
  children.forEach(function patchChild(child) {
    // Recurse into fragments
    if (child.tag === '#document-fragment') {
      child.children.forEach(patchChild);
      return;
    }
    // Try to find a matching child in the target
    let matched = noMatch;
    for (let i = size; i < target.childNodes.length; ++i) {
      let node = target.childNodes[i];
      if (shouldPatch(node, child)) {
        matched = node;
        break;
      }
    }
    // Patch a DOM node
    let patched = patchNode(matched, child);
    // Insert into the tree if not already in the correct position
    let sibling = target.childNodes[size] || null;
    if (patched !== sibling) {
      target.insertBefore(patched, sibling);
    }
    let lifecycleEvent = patched === matched ? 'updated' : 'created';
    lifecycle(lifecycleEvent, patched, child.props);
    size += 1;
  });
  // Remove remaining children in the target node
  while (target.childNodes.length > size) {
    let node = target.lastChild;
    target.removeChild(node);
    lifecycle('removed', node);
  }
}

function shouldAssignProperty(node, name, value) {
  return typeof value === 'function';
}

function sameTagName(node, element) {
  return String(element.tag).toLowerCase() === String(node.nodeName).toLowerCase();
}

function propToAttributeName(name) {
  switch (name) {
    case 'key': return 'x-key';
    case 'children': return null;
    case 'updateChildren': return null;
    case 'onTargetCreated': return null;
    case 'onElementCreated': return null;
  }
  return name;
}

function shouldPatch(node, element) {
  if (!sameTagName(node, element)) {
    return false;
  }
  if (element.props.id) {
    return node.id === element.props.id;
  }
  if (element.props.key) {
    return node.getAttribute('x-key') === element.props.key;
  }
  return true;
}

export class DOMTarget {

  constructor(node) {
    if (typeof node === 'string') {
      node = window.document.querySelector(node);
    }
    this._node = node;
  }

  get node() {
    return this._node;
  }

  patch(tree) {
    let children = tree.tag === '#document-fragment' ? tree.children : [tree];
    patchChildren(this._node, children);
  }

}

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
    if (element.props.key) {
      target[symbols.elementKey] = element.props.key;
    }
  }

  patchAttributes(target, element);
  if (!element.props.contentManager) {
    patchChildren(target, element.children);
  }
  return target;
}

function patchAttributes(target, element) {
  let names = new Set();
  // Set attributes defined by the element
  Object.keys(element.props).forEach(key => {
    let name = propToAttributeName(key);
    let value = element.props[key];
    if (!name || value === null || value === undefined) {
      return;
    }
    let assignProp = shouldAssignProperty(target, name, value);
    let attrValue = assignProp ? '' : value;
    if (target.getAttribute(name) !== attrValue) {
      target.setAttribute(name, attrValue);
    }
    if (assignProp) {
      target[name] = value;
    }
    names.add(name);
  });
  // Remove attributes not defined by the element
  let { attributes } = target;
  for (let i = attributes.length - 1; i >= 0; --i) {
    let { name } = attributes[i];
    if (!names.has(name)) {
      target.removeAttribute(name);
      if (shouldAssignProperty(target, name)) {
        target[name] = undefined;
      }
    }
  }
}

function lifecycle(event, node, props = null) {
  switch (event) {
    case 'created':
      if (props.contentManager) {
        let manager = node[symbols.contentManager] = new props.contentManager();
        manager.mount(new DOMTarget(node));
      }
      break;
    case 'updated':
      // Not currently used
      break;
    case 'removed':
      node[symbols.contentManager].unmount();
      break;
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
    lifecycle(patched === matched ? 'updated' : 'created', patched, child.props);
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
    case 'key':
    case 'children':
    case 'contentManager':
      return null;
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
    return node[symbols.elementKey] === element.props.key;
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

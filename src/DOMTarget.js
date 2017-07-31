import Observable from 'zen-observable';
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

function lifecycleHooks(node, props) {
  return {
    created() {
      let { contentManager } = props;
      if (contentManager) {
        let target = new DOMTarget(node);
        let states = new PushStream();
        let trees = contentManager[symbols.mapStateToContent](states.observable);
        states.push(props.contentManagerState);
        target.mount(trees);
        node[symbols.domNodeData] = { states, target };
      }
    },
    updated() {
      let data = node[symbols.domNodeData];
      if (data) {
        data.states.push(props.contentManagerState);
      }
    },
    removed() {
      let data = node[symbols.domNodeData];
      if (data) {
        data.target.unmount();
        node[symbols.domNodeData] = null;
      }
    },
  };
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
    let hooks = lifecycleHooks(patched, child.props);
    if (patched === matched) {
      hooks.updated();
    } else {
      hooks.created();
    }
    size += 1;
  });
  // Remove remaining children in the target node
  while (target.childNodes.length > size) {
    let node = target.lastChild;
    target.removeChild(node);
    lifecycleHooks(node).removed();
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
      return 'data-key';
    case 'children':
    case 'contentManager':
    case 'contentManagerState':
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
    return node.getAttribute('data-key') === element.props.key;
  }
  return true;
}

export class DOMTarget {

  constructor(node) {
    if (typeof node === 'string') {
      node = window.document.querySelector(node);
    }
    if (!node) {
      throw new TypeError(`${node} is not a DOM element`);
    }
    this._node = node;
    this._subscription = null;
  }

  mount(updates) {
    if (this._subscription) {
      throw new Error('Target already mounted');
    }
    this._subscription = Observable.from(updates).subscribe(tree => {
      let children = tree.tag === '#document-fragment' ? tree.children : [tree];
      patchChildren(this._node, children);
    });
  }

  unmount() {
    this._subscription.unsubscribe();
    this._subscription = null;
  }

}

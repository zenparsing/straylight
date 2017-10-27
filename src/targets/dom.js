import Observable from 'zen-observable';
import PushStream from 'zen-push';
import { Element } from '../Element.js';
import * as symbols from '../symbols.js';

const schedule = function makeScheduler() {
  let scheduled = false;
  let callbacks = [];

  function run() {
    try {
      while (callbacks.length > 0) {
        callbacks.shift()();
      }
      scheduled = false;
    } catch (err) {
      window.requestAnimationFrame(run);
      throw err;
    }
  }

  return function schedule(fn) {
    callbacks.push(fn);
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(run);
    }
  };
}();

export function renderToDOM(node, updates) {
  if (typeof node === 'string') {
    node = window.document.querySelector(node);
  }

  if (!node || !node.nodeName) {
    throw new TypeError(`${node} is not a DOM element`);
  }

  if (updates[symbols.element]) {
    updates = Observable.of(updates);
  }

  let current = null;
  let queued = false;

  function patch() {
    queued = false;
    let tree = Element.from(current);
    current = null;
    patchChildren(node, tree.tag === '#document-fragment' ? tree.children : [tree]);
  }

  return Observable.from(updates).subscribe(value => {
    current = value;
    if (!queued) {
      schedule(patch);
      queued = true;
    }
  });
}

function getNamespace(element, context) {
  if (element.props.xmlns) {
    return element.props.xmlns;
  }
  switch (element.tag.toLowerCase()) {
    case 'svg':
      return 'http://www.w3.org/2000/svg';
    default:
      return context.namespaceURI || 'http://www.w3.org/1999/xhtml';
  }
}

function patchNode(target, element, context) {
  if (typeof element.tag !== 'string') {
    throw new Error(`Invalid element tag ${element.tag}`);
  }

  if (element.tag === '#document-fragment') {
    throw new Error('Cannot patch a document fragment');
  }

  if (element.tag === '#text') {
    if (target && target.nodeName === '#text') {
      if (target.nodeValue !== element.props.text) {
        target.nodeValue = element.props.text;
      }
      return target;
    }
    return context.ownerDocument.createTextNode(element.props.text);
  }

  if (!target || !compatible(target, element)) {
    let ns = getNamespace(element, context);
    target = context.ownerDocument.createElementNS(ns, element.tag);
  }

  patchAttributes(target, element.props);

  if (!element.props.contentManager) {
    patchChildren(target, element.children);
  }

  return target;
}

function patchAttributes(target, props) {
  let attributes = propsToAttributes(props);

  // Set attributes defined by the element
  attributes.forEach((value, name) => {
    if (isEventHandler(name)) {
      target.setAttribute(name, '');
      target[name] = value;
    } else {
      target.setAttribute(name, value);
    }
  });

  // Remove attributes not defined by the element
  for (let i = target.attributes.length - 1; i >= 0; --i) {
    let { name } = target.attributes[i];
    if (!attributes.has(name)) {
      target.removeAttribute(name);
      if (isEventHandler(name)) {
        target[name] = undefined;
      }
    }
  }
}

const NodeData = {

  get(node) {
    return node[symbols.nodeData] || {};
  },

  assign(node, data) {
    let nodeData = node[symbols.nodeData];
    if (!nodeData) {
      node[symbols.nodeData] = data;
    } else {
      Object.assign(nodeData, data);
    }
  },

  clear(node) {
    node[symbols.nodeData] = null;
  },

};

const Lifecycle = {

  created(node, props) {
    let { contentManager, onTargetCreated, onTargetUpdated, onTargetRemoved } = props;

    if (contentManager) {
      let states = new PushStream();
      let updates = contentManager[symbols.mapStateToContent](states.observable);
      states.next(props.contentManagerState);
      let subscription = renderToDOM(node, updates);
      NodeData.assign(node, { states, subscription, contentManager });
    }

    if (onTargetUpdated || onTargetRemoved) {
      NodeData.assign(node, { onTargetUpdated, onTargetRemoved });
    }

    if (onTargetCreated) {
      schedule(() => onTargetCreated({ target: node }));
    }
  },

  updated(node, props) {
    let { states, onTargetUpdated } = NodeData.get(node);

    if (states) {
      states.next(props.contentManagerState);
    }

    if (onTargetUpdated) {
      schedule(() => onTargetUpdated({ target: node }));
    }
  },

  removed(node) {
    let { subscription, states, onTargetRemoved } = NodeData.get(node);

    if (states) {
      states.complete();
      subscription.unsubscribe();
    }

    if (onTargetRemoved) {
      schedule(() => onTargetRemoved({ target: node }));
    }

    NodeData.clear(node);
  },

};

function patchChildren(target, children) {
  let size = 0;
  children.forEach(function patchChild(child) {
    // Recurse into fragments
    if (child.tag === '#document-fragment') {
      child.children.forEach(patchChild);
      return;
    }
    // Try to find a matching child in the target
    let matched = null;
    for (let i = size; i < target.childNodes.length; ++i) {
      let node = target.childNodes[i];
      if (shouldPatch(node, child)) {
        matched = node;
        break;
      }
    }
    // Patch a DOM node
    let patched = patchNode(matched, child, target);
    // Insert into the tree if not already in the correct position
    let sibling = target.childNodes[size] || null;
    if (patched !== sibling) {
      target.insertBefore(patched, sibling);
    }
    // Call lifecycle hooks for the DOM node
    if (patched === matched) {
      Lifecycle.updated(patched, child.props);
    } else {
      Lifecycle.created(patched, child.props);
    }
    size += 1;
  });
  // Remove remaining children in the target node
  while (target.childNodes.length > size) {
    let node = target.lastChild;
    target.removeChild(node);
    Lifecycle.removed(node);
  }
}

function propsToAttributes(props) {
  let map = new Map();
  Object.keys(props).forEach(name => {
    let value = props[name];
    switch (name) {
      case 'key':
        name = 'ui-key';
        break;
      case 'children':
      case 'contentManager':
      case 'contentManagerState':
      case 'onTargetCreated':
        value = null;
        break;
    }
    if (value === null || value === undefined || value === false) {
      return;
    }
    name = name.toLowerCase();
    if (value === true) {
      value = name;
    }
    map.set(name, value);
  });
  return map;
}

function isEventHandler(name) {
  return name !== 'on' && name.startsWith('on');
}

function compatible(node, element) {
  let { tag } = element;
  let { nodeName } = node;
  return (
    typeof tag === 'string' &&
    typeof nodeName === 'string' &&
    tag.toLowerCase() === nodeName.toLowerCase() &&
    (nodeName !== 'INPUT' || element.props.type === node.type)
  );
}

function shouldPatch(node, element) {
  if (!compatible(node, element)) {
    return false;
  }
  let { props } = element;
  if (props.contentManager) {
    let data = node[symbols.nodeData];
    if (!data || data.contentManager !== props.contentManager) {
      return false;
    }
  }
  if (props.id) {
    return node.id === props.id;
  }
  if (props.key) {
    return node.getAttribute('ui-key') === props.key;
  }
  return true;
}

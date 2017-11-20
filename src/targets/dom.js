import { Scheduler } from './Scheduler.js';
import { diff } from './diff.js';

const htmlNS = 'http://www.w3.org/1999/xhtml';

const scheduler = new Scheduler(fn => window.requestAnimationFrame(fn));

export function renderToDOM(node, updates) {
  if (typeof node === 'string') {
    node = window.document.querySelector(node);
  }

  if (!node || !node.nodeName) {
    throw new TypeError(`${node} is not a DOM element`);
  }

  return diff(updates, scheduler).subscribe(tree => {
    patchChildren(node, tree.tag === '#document-fragment' ? tree.children : [tree]);
  });
}

function getNamespace(element, context) {
  if (element.props.xmlns) {
    return element.props.xmlns;
  }
  switch (element.tag) {
    case 'svg':
      return 'http://www.w3.org/2000/svg';
    default:
      return context.namespaceURI || htmlNS;
  }
}

function createNode(element, context) {
  if (element.tag === '#text') {
    return context.ownerDocument.createTextNode(element.props.text);
  }

  let namespace = getNamespace(element, context);
  let document = context.ownerDocument;

  let node = namespace === htmlNS ?
    document.createElement(element.tag) :
    document.createElementNS(namespace, element.tag);

  patchNode(node, element);
  return node;
}

function patchNode(target, element) {
  if (element.tag === '#text') {
    if (target.nodeValue !== element.props.text) {
      target.nodeValue = element.props.text;
    }
  } else {
    patchAttributes(target, element.props);
    if (!element.props.contentManager) {
      patchChildren(target, element.children);
    }
  }
}

function getAttributeNames(target) {
  if (target.getAttributeNames) {
    return target.getAttributeNames();
  }
  let names = [];
  for (let i = 0; i < target.attributes.length; ++i) {
    names.push(target.attributes[i].name);
  }
  return names;
}

function isMagicProp(name) {
  switch (name) {
    case 'children':
    case 'contentManager':
    case 'contentManagerState':
    case 'onTargetCreated':
    case 'onTargetUpdated':
      return true;
  }
  return false;
}

function patchAttributes(target, props) {
  // Assign attributes in props
  for (let name in props) {
    if (isMagicProp(name)) {
      continue;
    }
    let value = props[name];
    let assign = typeof value === 'function' && /^on\w/.test(name);
    if (value === null || value === undefined || value === false) {
      if (assign) {
        target[name] = undefined;
      } else {
        target.removeAttribute(name);
      }
    } else {
      if (assign) {
        target[name] = value;
      } else {
        target.setAttribute(name, value === true ? name : value);
      }
    }
  }
  // Remove attributes not in props
  let names = getAttributeNames(target);
  for (let i = 0; i < names.length; ++i) {
    let name = names[i];
    if (!(name in props)) {
      target.removeAttribute(name);
    }
  }
}

function onNodeCreated(node, props) {
  if (props.onTargetCreated) {
    scheduler.enqueue(() => props.onTargetCreated({ target: node }));
  }
}

function onNodeUpdated(node, props) {
  if (props.onTargetUpdated) {
    scheduler.enqueue(() => props.onTargetUpdated({ target: node }));
  }
}

function onNodeRemoved() {
  // Empty
}

function compatible(node, element) {
  let props = element.props;
  if (props.id && props.id !== node.id) {
    return false;
  }
  let nodeName = node.nodeName.toLowerCase();
  if (nodeName === 'input' && props.type !== node.type) {
    return false;
  }
  return nodeName === element.tag;
}

function patchChildrenFrom(target, reference, children) {
  for (let i = 0; i < children.length; ++i) {
    let child = children[i];
    if (typeof child.tag !== 'string') {
      throw new Error(`Invalid element tag ${child.tag}`);
    }
    // Recurse into fragments
    if (child.tag === '#document-fragment') {
      reference = patchChildrenFrom(target, reference, child.children);
      continue;
    }
    // Search for a matching child in the target
    let node = null;
    for (node = reference; node !== null; node = node.nextSibling) {
      if (compatible(node, child)) {
        break;
      }
    }
    if (node !== null) {
      // Patch a DOM node
      patchNode(node, child);
      onNodeUpdated(node, child.props);
    } else {
      // Create a DOM node
      node = createNode(child, target);
      onNodeCreated(node, child.props);
    }
    // Insert into the correct position
    if (reference === null) {
      target.appendChild(node);
    } else if (node !== reference) {
      target.insertBefore(node, reference);
    }
    reference = node.nextSibling;
  }
  return reference;
}

function patchChildren(target, children) {
  let reference = patchChildrenFrom(target, target.firstChild, children);
  while (reference !== null) {
    let node = reference;
    reference = reference.nextSibling;
    target.removeChild(node);
    onNodeRemoved(node);
  }
}

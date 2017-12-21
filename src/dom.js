const HTML_NS = 'http://www.w3.org/1999/xhtml';

function doc(node) {
  return node.ownerDocument;
}

export function isElement(x) {
  return x && x.nodeType === 1;
}

export function firstChild(node) {
  return node.firstChild;
}

export function lastChild(node) {
  return node.lastChild;
}

export function setAttr(node, name, value) {
  if (name[0] === '.') {
    node[name.slice(1)] = value;
    return;
  }
  if (value === undefined || value === false) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, value === true ? name : value);
  }
}

export function setTextValue(node, text) {
  node.nodeValue = text;
}

export function createText(text, context) {
  return doc(context).createTextNode(text);
}

export function createElement(tag, context) {
  let namespace = getNamespace(tag, context);
  return namespace === HTML_NS ?
    doc(context).createElement(tag) :
    doc(context).createElementNS(namespace, tag);
}

export function createFragment(context) {
  return doc(context).createDocumentFragment();
}

export function appendNode(child, parent) {
  parent.insertBefore(child, null);
}

export function insertBefore(node, next) {
  next.parentNode.insertBefore(node, next);
}

export function insertSiblings(first, last, nextNode) {
  let parent = nextNode.parentNode;
  for (let next; first; first = next) {
    next = first.nextSibling;
    parent.insertBefore(first, nextNode);
    if (first === last) {
      break;
    }
  }
}

export function removeSiblings(first, last) {
  let parent = first.parentNode;
  for (let next; first; first = next) {
    next = first.nextSibling;
    parent.removeChild(first);
    if (first === last) {
      break;
    }
  }
}

function getNamespace(tag, context) {
  switch (tag) {
    case 'svg':
      return 'http://www.w3.org/2000/svg';
    default:
      return context.namespaceURI || HTML_NS;
  }
}

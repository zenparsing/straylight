const HTML_NS = 'http://www.w3.org/1999/xhtml';

function doc(node) {
  return node.ownerDocument;
}

export function isElement(x) {
  return x && x.nodeType === 1;
}

export function setAttr(node, name, value) {
  if (name[0] === '.') {
    node[name.slice(1)] = value;
    return;
  }
  if (value === undefined || value === null || value === false) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, value === true ? name : value);
  }
}

function convertToString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
}

export function setTextValue(node, text) {
  node.nodeValue = convertToString(text);
}

export function createText(text, context) {
  return doc(context).createTextNode(convertToString(text));
}

export function insertMarker(parent, next) {
  let marker = doc(parent).createTextNode('');
  parent.insertBefore(marker, next);
  return marker;
}

export function createElement(tag, context) {
  let namespace = getNamespace(tag, context);
  return namespace === HTML_NS ?
    doc(context).createElement(tag) :
    doc(context).createElementNS(namespace, tag);
}

export function insertChild(node, parent, next) {
  parent.insertBefore(node, next || null);
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

export function clearChildren(parent) {
  if (parent.firstChild) {
    removeSiblings(parent.firstChild, parent.lastChild);
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

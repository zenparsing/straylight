const HTML_NS = 'http://www.w3.org/1999/xhtml';

function doc(node) {
  return node.ownerDocument;
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
  parent.appendChild(child);
}

export function insertBefore(node, next) {
  next.parentNode.insertBefore(node, next);
}

export function insertSiblings(first, last, next) {
  let parent = next.parentNode;
  for (let node = first; node; node = node.nextSibling) {
    parent.insertBefore(node, next);
    if (node === last) {
      break;
    }
  }
}

export function removeSiblings(first, last) {
  let parent = first.parentNode;
  for (let node = first; node; node = node.nextSibling) {
    parent.removeChild(node);
    if (node === last) {
      break;
    }
  }
}

export function replaceSiblings(first, last, node) {
  let parent = first.parentNode;
  parent.replaceChild(node, first);
  for (let node = first.nextSibling; node; node = node.nextSibling) {
    parent.removeChild(node);
    if (node === last) {
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

import { Scheduler } from './Scheduler.js';
import { persist } from './persist.js';

const htmlNS = 'http://www.w3.org/1999/xhtml';
const scheduler = new Scheduler(fn => window.requestAnimationFrame(fn));

export function renderToDOM(node, updates) {
  return persist(updates, {
    actions: new DOMActions(node),
    nodesMatch,
    scheduler,
  }).subscribe(() => {});
}

class DOMActions {

  constructor(mount) {
    if (typeof mount === 'string') {
      mount = window.document.querySelector(mount);
    }
    if (!mount || !mount.nodeName) {
      throw new TypeError(`${mount} is not a DOM element`);
    }
    this.mount = mount;
  }

  onCreate(element, parent, pos) {
    element.previous = getPrevious(parent, pos);

    let parentNode = parent ? parent.dom : this.mount;
    let document = parentNode.ownerDocument;

    if (isFragment(element)) {
      element.dom = parentNode;
      return;
    }

    if (isText(element)) {
      element.dom = document.createTextNode(element.props.text || '');
      return;
    }

    let tag = element.tag;
    let namespace = getNamespace(element, parentNode);

    element.dom = namespace === htmlNS ?
      document.createElement(tag) :
      document.createElementNS(namespace, tag);

    for (let key in element.props) {
      if (!isMagicProp(key)) {
        setProp(element, key, element.props[key]);
      }
    }
  }

  afterCreate(element, parent) {
    if (!parent) {
      this.mount.textContent = '';
    }
    for (let i = 0; i < element.children.length; ++i) {
      appendChild(element.children[i], element);
    }
    if (!parent && !isFragment(element)) {
      this.mount.appendChild(element.dom);
    }
    if (element.props.createdCallback) {
      scheduler.enqueue(() => element.props.createdCallback(element.dom));
    }
  }

  onUpdate(current, next) {
    next.dom = current.dom;
    next.previous = current.previous;

    let seen = Object.create(null);

    for (let key in next.props) {
      if (!isMagicProp(key)) {
        let value = next.props[key];
        seen[key] = 1;
        if (current.props[key] !== value) {
          setProp(next, key, value);
        }
      }
    }

    for (let key in current.props) {
      if (!isMagicProp(key) && !seen[key]) {
        setProp(next, key, undefined);
      }
    }
  }

  afterUpdate(current, next) {
    if (next.props.updatedCallback) {
      scheduler.enqueue(() => next.props.updatedCallback(next.dom));
    }
  }

  onInsert(element, parent) {
    moveChild(element, parent);
  }

  onMove(element, parent, pos) {
    let prev = getPrevious(parent, pos);
    if (element.previous !== prev) {
      element.previous = prev;
      moveChild(element, parent);
    }
  }

  onRemove(element, parent) {
    if (isFragment(element)) {
      for (let i = 0; i < element.children.length; ++i) {
        this.onRemove(element.children[i], parent);
      }
    } else {
      let parentNode = parent ? parent.dom : this.mount;
      parentNode.removeChild(element.dom);
    }
  }

}

function moveChild(element, parent) {
  if (isFragment(element)) {
    for (let i = 0; i < element.children.length; ++i) {
      moveChild(element.children[i], element);
    }
  } else {
    let next = element.previous ? element.previous.dom.nextSibling : null;
    parent.dom.insertBefore(element.dom, next);
  }
}

function appendChild(element, parent) {
  if (isFragment(element)) {
    for (let i = 0; i < element.children.length; ++i) {
      appendChild(element.children[i], parent);
    }
  } else {
    parent.dom.appendChild(element.dom);
  }
}

function getPrevious(parent, pos) {
  if (pos === 0) {
    return parent && isFragment(parent) ? parent.previous : null;
  }
  let prev = parent.children[pos - 1];
  return isFragment(prev) ? getPrevious(prev, prev.children.length) : prev;
}

function setProp(element, key, value) {
  let node = element.dom;
  if (isText(element)) {
    if (key === 'text') {
      node.nodeValue = value || '';
    }
  } else if (shouldAssign(key, value)) {
    node[key] = value;
  } else if (value === null || value === undefined || value === false) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, value === true ? key : value);
  }
}

function shouldAssign(name, value) {
  return typeof value === 'function' && /^on\w/.test(name);
}

function isText(element) {
  return element.tag === '#text';
}

function isFragment(element) {
  return element.tag === '#document-fragment';
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

function isMagicProp(name) {
  switch (name) {
    case 'children':
    case 'createdCallback':
    case 'updatedCallback':
    case 'removedCallback':
    case 'uiClass':
    case 'uiState':
      return true;
  }
  return false;
}

function nodesMatch(a, b) {
  return (
    a.tag === b.tag &&
    (a.props.id || '') === (b.props.id || '') &&
    (a.tag !== 'input' || a.props.type === b.props.type) &&
    (a.props.uiClass || null) === (b.props.uiClass || null)
  );
}

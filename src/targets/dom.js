import { Element } from '../Element.js';
import { Scheduler } from './Scheduler.js';
import { persist } from './persist.js';

const htmlNS = 'http://www.w3.org/1999/xhtml';
const scheduler = new Scheduler(fn => window.requestAnimationFrame(fn));

export function renderToDOM(mount, updates) {
  if (typeof mount === 'string') {
    mount = window.document.querySelector(mount);
  }
  if (!mount || !mount.nodeName) {
    throw new TypeError(`${mount} is not a DOM element`);
  }
  let root = new Element('#root');
  root.data = { target: mount };
  return persist(updates, { actions: DOMActions, root, scheduler }).subscribe(() => {});
}

const DOMActions = {

  onCreate(element, parent, pos) {
    element.data.previous = getPrevious(parent, pos);

    let parentNode = dom(parent);
    let document = parentNode.ownerDocument;

    if (isFragment(element)) {
      element.data.target = parentNode;
      return;
    }

    if (isText(element)) {
      element.data.target = document.createTextNode(element.props.value || '');
      return;
    }

    let tag = element.tag;
    let namespace = getNamespace(element, parentNode);

    element.data.target = namespace === htmlNS ?
      document.createElement(tag) :
      document.createElementNS(namespace, tag);

    for (let key in element.props) {
      if (!isMagicProp(key)) {
        setProp(element, key, element.props[key]);
      }
    }
  },

  afterCreate(element) {
    if (!isFragment(element) && element.props.createdCallback) {
      scheduler.enqueue(() => element.props.createdCallback(dom(element)));
    }
  },

  onUpdate(current, next) {
    if (isFragment(next)) {
      return;
    }

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
  },

  afterUpdate(element) {
    if (!isFragment(element) && element.props.updatedCallback) {
      scheduler.enqueue(() => element.props.updatedCallback(dom(element)));
    }
  },

  onInsert(element, parent) {
    moveChild(element, parent);
  },

  onMove(element, parent, pos) {
    let prev = getPrevious(parent, pos);
    if (element.data.previous !== prev) {
      element.data.previous = prev;
      moveChild(element, parent);
    }
  },

  onRemove(element, parent) {
    if (isFragment(element)) {
      for (let i = 0; i < element.children.length; ++i) {
        this.onRemove(element.children[i], parent);
      }
    } else {
      let parentNode = parent ? dom(parent) : this.mount;
      parentNode.removeChild(dom(element));
      if (element.props.removedCallback) {
        scheduler.enqueue(() => element.props.removedCallback(dom(element)));
      }
    }
  },

};

function moveChild(element, parent) {
  if (isFragment(element)) {
    for (let i = 0; i < element.children.length; ++i) {
      moveChild(element.children[i], element);
    }
  } else {
    let prev = element.data.previous;
    let next = prev ? dom(prev).nextSibling : null;
    dom(parent).insertBefore(dom(element), next);
  }
}

function getPrevious(parent, pos) {
  if (pos === 0) {
    return isFragment(parent) ? parent.data.previous : null;
  }
  let prev = parent.children[pos - 1];
  return isFragment(prev) ? getPrevious(prev, prev.children.length) : prev;
}

function setProp(element, key, value) {
  let node = dom(element);
  if (isText(element)) {
    if (key === 'value') {
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

function dom(element) {
  return element.data.target;
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
    case 'createdCallback':
    case 'updatedCallback':
    case 'removedCallback':
      return true;
  }
  return false;
}

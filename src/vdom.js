const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;',
};

const rawTags = /^(?:script|style)$/i;

const voidTags = new RegExp(`^(?:
  area|base|basefont|bgsound|br|col|command|embed|frame|hr|
  img|input|isindex|keygen|link|meta|param|source|track|wbr
)$`.replace(/\s/g, ''), 'i');

function esc(s) {
  s = '' + (s || '');
  return /[&<>"'`]/.test(s) ? s.replace(/[&<>"'`]/g, m => htmlEscapes[m]) : s;
}

export function createDocument() {
  return new Document();
}

class Document {
  createTextNode(text) {
    return new TextNode(this, text);
  }

  createElement(tag) {
    return new Element(this, tag);
  }

  createElementNS(namespace, tag) {
    let e = new Element(this, tag);
    e.namespaceURI = namespace;
    return e;
  }

  createDocumentFragment() {
    return new DocumentFragment(this);
  }
}

class Node {
  constructor(doc, type, name) {
    this.nodeType = type;
    this.nodeName = name;
    this.ownerDocument = doc;
    this.parentNode = null;
    this.nextSibling = null;
    this.previousSibling = null;
    this.namespaceURI = null;
  }

  get nextElementSibling() {
    for (let node = this.nextSibling; node; node = node.nextSibling) {
      if (node.nodeType === 1) {
        return node;
      }
    }
    return null;
  }

  get previousElementSibling() {
    for (let node = this.previousSibling; node; node = node.previousSibling) {
      if (node.nodeType === 1) {
        return node;
      }
    }
    return null;
  }
}

class TextNode extends Node {
  constructor(doc, text) {
    super(doc, 3, '#text');
    this.nodeValue = text;
  }

  toDataObject() {
    return this.nodeValue;
  }

  get innerHTML() {
    return rawTags.test(this.parentNode.nodeName) ? this.nodeValue : esc(this.nodeValue);
  }

  get outerHTML() {
    return this.innerHTML;
  }
}

class ParentNode extends Node {
  constructor(doc, type, name) {
    super(doc, type, name);
    this.firstChild = null;
    this.lastChild = null;
  }

  get firstElementChild() {
    for (let node = this.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 1) {
        return node;
      }
    }
    return null;
  }

  get lastElementChild() {
    for (let node = this.lastChild; node; node = node.previousSibling) {
      if (node.nodeType === 1) {
        return node;
      }
    }
    return null;
  }

  removeChild(node) {
    if (node.parentNode !== this) {
      throw new Error('Node is not a child of the parent node');
    }
    let prev = node.previousSibling;
    let next = node.nextSibling;
    prev ? prev.nextSibling = next : this.firstChild = next;
    next ? next.previousSibling = prev : this.lastChild = prev;
    node.parentNode = null;
    node.previousSibling = null;
    node.nextSibling = null;
  }

  appendChild(node) {
    this.insertBefore(node, null);
  }

  insertBefore(newNode, next) {
    if (next && next.parentNode !== this) {
      throw new Error('Node is not a child of the parent node');
    }
    if (newNode === next) {
      return;
    }
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    let prev = next ? next.previousSibling : this.lastChild;
    if (newNode.nodeName === '#document-fragment') {
      for (let child = newNode.firstChild; child;) {
        let nextChild = child.nextSibling;
        this.insertBefore(child, next);
        child = nextChild;
      }
    } else {
      prev ? prev.nextSibling = newNode : this.firstChild = newNode;
      next ? next.previousSibling = newNode : this.lastChild = newNode;
      newNode.previousSibling = prev;
      newNode.nextSibling = next;
      newNode.parentNode = this;
    }
  }

  toDataObject() {
    let childNodes = [];
    for (let node = this.firstChild; node; node = node.nextSibling) {
      let data = node.toDataObject();
      if (data) {
        childNodes.push(data);
      }
    }
    return { nodeName: this.nodeName, childNodes };
  }
}

class Element extends ParentNode {
  constructor(doc, tag) {
    super(doc, 1, tag);
    this._attributes = new Map();
  }

  getAttribute(name) {
    let value = this._attributes.get(String(name));
    return value === undefined ? null : value;
  }

  setAttribute(name, value) {
    this._attributes.set(String(name), String(value));
  }

  hasAttribute(name) {
    return this._attributes.has(String(name));
  }

  removeAttribute(name) {
    this._attributes.delete(String(name));
  }

  toDataObject() {
    let data = super.toDataObject();
    data.attributes = {};
    this._attributes.forEach((value, key) => data.attributes[key] = value);
    return data;
  }

  get innerHTML() {
    let html = '';
    for (let node = this.firstChild; node; node = node.nextSibling) {
      html += node.outerHTML;
    }
    return html;
  }

  get outerHTML() {
    let html = `<${this.nodeName}`;
    this._attributes.forEach((value, key) => {
      html += ` ${esc(key)}="${esc(value)}"`;
    });
    if (!this.firstChild && voidTags.test(this.nodeName)) {
      html += ' />';
    } else {
      html += `>${this.innerHTML}</${this.nodeName}>`;
    }
    return html;
  }
}

class DocumentFragment extends ParentNode {
  constructor(doc) {
    super(doc, 1, '#document-fragment');
  }
}

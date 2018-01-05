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

export class Document {
  createTextNode(text) {
    return new Text(this, text);
  }

  createElement(tag) {
    return new Element(this, tag);
  }

  createElementNS(namespace, tag) {
    let e = new Element(this, tag);
    e.namespaceURI = namespace;
    return e;
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

class Text extends Node {
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
    prev ? prev.nextSibling = newNode : this.firstChild = newNode;
    next ? next.previousSibling = newNode : this.lastChild = newNode;
    newNode.previousSibling = prev;
    newNode.nextSibling = next;
    newNode.parentNode = this;
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
    this.attributes = new Map();
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  toDataObject() {
    let data = super.toDataObject();
    data.attributes = {};
    this.attributes.forEach((value, key) => data.attributes[key] = value);
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
    this.attributes.forEach((value, key) => {
      if (value !== null && value !== undefined && value !== false) {
        html += ` ${esc(key)}="${esc(value === true ? key : value)}"`;
      }
    });
    if (!this.firstChild && voidTags.test(this.nodeName)) {
      html += ' />';
    } else {
      html += `>${this.innerHTML}</${this.nodeName}>`;
    }
    return html;
  }
}

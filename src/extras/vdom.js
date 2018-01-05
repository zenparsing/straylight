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

function findChild(parent, node) {
  let i = parent.childNodes.indexOf(node);
  if (i < 0) {
    throw new Error('Node is not a child of the specified parent');
  }
  return i;
}

function isFragment(x) {
  return x.nodeType === 11;
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
    this.namespaceURI = null;
  }
}

class ParentNode extends Node {
  constructor(doc, type, name) {
    super(doc, type, name);
    this.childNodes = [];
  }

  get firstChild() {
    return this.childNodes.length > 0 ? this.childNodes[0] : null;
  }

  get lastChild() {
    let length = this.childNodes.length;
    return length > 0 ? this.childNodes[length - 1] : null;
  }

  removeChild(node) {
    let pos = findChild(this, node);
    if (pos > 0) {
      this.childNodes[pos - 1].nextSibling = node.nextSibling;
    }
    this.childNodes.splice(pos, 1);
    node.parentNode = null;
    node.nextSibling = null;
  }

  insertBefore(newNode, next) {
    if (newNode === next) {
      return;
    }
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    let pos = next ? findChild(this, next) : this.childNodes.length;
    if (isFragment(newNode)) {
      if (newNode.childNodes.length > 0) {
        newNode.lastChild.nextSibling = next;
        if (pos > 0) {
          this.childNodes[pos - 1].nextSibling = newNode.firstChild;
        }
        this.childNodes.splice(pos, 0, ...newNode.childNodes);
        for (let i = 0; i < newNode.childNodes.length; ++i) {
          newNode.childNodes[i].parentNode = this;
        }
        newNode.childNodes.length = 0;
      }
    } else {
      if (pos > 0) {
        this.childNodes[pos - 1].nextSibling = newNode;
      }
      this.childNodes.splice(pos, 0, newNode);
      newNode.parentNode = this;
      newNode.nextSibling = next;
    }
  }

  toDataObject() {
    return {
      nodeName: this.nodeName,
      childNodes: this.childNodes
        .map(child => child.toDataObject())
        .filter(data => Boolean(data)),
    };
  }
}

class Element extends ParentNode {
  constructor(doc, tag) {
    super(doc, 1, tag);
    this.attributes = new Map();
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

  toHTML() {
    let html = `<${this.nodeName}`;
    this.attributes.forEach((value, key) => {
      if (value !== null && value !== undefined && value !== false) {
        html += ` ${esc(key)}="${esc(value === true ? key : value)}"`;
      }
    });
    if (this.childNodes.length === 0 && voidTags.test(this.nodeName)) {
      html += ' />';
    } else {
      html += '>';
      this.childNodes.forEach(child => html += child.toHTML());
      html += `</${this.nodeName}>`;
    }
    return html;
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

  toHTML() {
    return rawTags.test(this.parentNode.nodeName) ? this.nodeValue : esc(this.nodeValue);
  }
}

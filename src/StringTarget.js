import { PushStream } from './PushStream.js';

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;',
};

function esc(s) {
  s = '' + (s || '');
  return /[&<>"'`]/.test(s) ? s.replace(/[&<>"'`]/g, m => HTML_ESCAPES[m]) : s;
}

function toAttributes(props) {
  let attr = {};
  Object.keys(props).forEach(key => {
    let name = propToAttributeName(key);
    let value = props[key];
    if (name && typeof value !== 'function') {
      attr[name] = value === true ? key : value;
    }
  });
  return attr;
}

function propToAttributeName(name) {
  switch (name) {
    case 'key':
    case 'children':
    case 'updateChildren':
      return null;
  }
  return name;
}

function stringify(element) {
  if (element.tag === '#text') {
    return esc(element.props.text);
  }
  let html = element.children.map(stringify).join('');
  if (element.tag !== '#document-fragment') {
    if (element.props.onTargetCreated) {
      let target = new StringTarget();
      element.props.onTargetCreated.call(undefined, target, new PushStream().observable);
      html = target.htmlString;
    }
    let attributes = toAttributes(element.props);
    let open = element.tag;
    let pairs = Object.keys(attributes).map(k => `${esc(k)}="${esc(attributes[k])}"`);
    if (pairs.length > 0) {
      open += ' ' + pairs.join(' ');
    }
    html = `<${open}>${html}</${element.tag}>`;
  }
  return html;
}

export class StringTarget {

  constructor() {
    this._html = '';
  }

  get htmlString() {
    return this._html;
  }

  patch(tree) {
    this._html = stringify(tree);
  }

  toString() {
    return this._html;
  }

}

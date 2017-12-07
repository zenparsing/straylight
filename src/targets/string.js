import { persist } from './persist.js';

export function renderToString(updates) {
  return new Promise((resolve, reject) => {
    persist(updates).subscribe({
      _subscription: null,
      start(s) { this._subscription = s; },
      next(v) {
        this._subscription.unsubscribe();
        resolve(stringify(v));
      },
      error(e) { reject(e); },
      complete() { resolve(''); },
    });
  });
}

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '`': '&#x60;',
};

const SELF_CLOSING = new RegExp('^(?:' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command',
  'embed', 'frame', 'hr', 'img', 'input', 'isindex', 'keygen',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
].join('|') + ')$', 'i');

function esc(s) {
  s = '' + (s || '');
  return /[&<>"'`]/.test(s) ? s.replace(/[&<>"'`]/g, m => HTML_ESCAPES[m]) : s;
}

function toAttributes(props) {
  let pairs = [];

  for (let name in props) {
    let value = props[name];

    if (
      value === null ||
      value === undefined ||
      value === false ||
      typeof value === 'function' ||
      name[0] === '.'
    ) {
      continue;
    }

    pairs.push(`${esc(name)}="${esc(value === true ? name : value)}"`);
  }

  return pairs;
}

function isRawTag(tag) {
  return tag === 'script' || tag === 'style';
}

function stringify(element) {
  if (element.tag === '#text') {
    return esc(element.props.value);
  }

  let tag = element.tag;
  let props = element.props;
  let children = element.children;

  let subtrees = isRawTag(tag) ?
    children.map(c => c.props.value || '') :
    children.map(stringify);

  let html = subtrees.join('');

  if (tag !== '#document-fragment') {
    let open = element.tag;
    let attributes = toAttributes(props);
    if (attributes.length > 0) {
      open += ' ' + attributes.join(' ');
    }
    if (!html && SELF_CLOSING.test(tag)) {
      html = `<${open} />`;
    } else {
      html = `<${open}>${html}</${tag}>`;
    }
  }

  return html;
}

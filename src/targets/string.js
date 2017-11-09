import Observable from 'zen-observable';
import PushStream from 'zen-push';
import { Element } from '../Element.js';
import * as symbols from '../symbols.js';

export function renderToString(updates) {
  return new Promise((resolve, reject) => {
    if (updates[symbols.element]) {
      updates = Observable.of(updates);
    }

    Observable.from(updates).subscribe({
      _subscription: null,
      start(s) { this._subscription = s; },
      next(update) {
        this._subscription.unsubscribe();
        resolve(stringify(Element.from(update)));
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
  let attr = {};
  Object.keys(props).forEach(name => {
    let value = props[name];

    if (
      value === null ||
      value === undefined ||
      value === false ||
      typeof value === 'function'
    ) {
      return;
    }

    switch (name) {
      case 'children':
      case 'contentManager':
      case 'contentManagerState':
      case 'onTargetCreated':
      case 'onTargetUpdated':
        return;
    }

    if (name === 'key') {
      name = 'ui-key';
    } else {
      name = name.toLowerCase();
    }

    if (value === true) {
      value = name;
    }

    attr[name] = value;
  });
  return attr;
}

function tryAsync(fn) {
  return new Promise(resolve => resolve(fn()));
}

function isRawTag(tag) {
  return tag === 'script' || tag === 'style';
}

function stringify(element) {
  return tryAsync(() => {
    if (element.tag === '#text') {
      return esc(element.props.text);
    }

    let { tag, props, children } = element;

    if (props.contentManager) {
      return renderContentManager(props.contentManager, props.contentManagerState);
    }

    let subtrees = isRawTag(element.tag) ?
      children.map(c => c.props.text || '') :
      children.map(stringify);

    return Promise.all(subtrees).then(list => {
      let html = list.join('');
      if (tag !== '#document-fragment') {
        let attributes = toAttributes(props);
        let open = element.tag;
        let pairs = Object.keys(attributes).map(k => `${esc(k)}="${esc(attributes[k])}"`);
        if (pairs.length > 0) {
          open += ' ' + pairs.join(' ');
        }
        if (!html && SELF_CLOSING.test(tag)) {
          html = `<${open} />`;
        } else {
          html = `<${open}>${html}</${tag}>`;
        }
      }
      return html;
    });
  });
}

function renderContentManager(manager, state) {
  let states = new PushStream();
  let updates = manager[symbols.mapStateToContent](states.observable);
  if (state) {
    states.next(state);
  }
  return renderToString(updates);
}

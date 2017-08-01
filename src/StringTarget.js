import Observable from 'zen-observable';
import { PushStream } from './PushStream.js';
import * as symbols from './symbols.js';

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
      return 'data-key';
    case 'children':
    case 'contentManager':
    case 'contentManagerState':
      return null;
  }
  return name;
}

function stringify(element) {
  if (element.tag === '#text') {
    return esc(element.props.text);
  }

  let { tag, props, children } = element;

  if (props.contentManager) {
    return renderContentManager(props.contentManager, props.contentManagerState);
  }

  let html = children.map(stringify).join('');

  if (tag !== '#document-fragment') {
    let attributes = toAttributes(props);
    let open = element.tag;
    let pairs = Object.keys(attributes).map(k => `${esc(k)}="${esc(attributes[k])}"`);
    if (pairs.length > 0) {
      open += ' ' + pairs.join(' ');
    }
    html = `<${open}>${html}</${tag}>`;
  }

  return html;
}

function renderContentManager(manager, state) {
  let target = new StringTarget();
  let states = new PushStream();
  let trees = manager[symbols.mapStateToContent](states.observable);
  if (state) {
    states.next(state);
  }
  target.mount(trees);
  target.unmount();
  states.complete();
  return target.htmlString;
}

export class StringTarget {

  constructor() {
    this._html = '';
    this._subscription = null;
  }

  get htmlString() {
    return this._html;
  }

  mount(updates) {
    if (this._subscription) {
      throw new Error('Target already mounted');
    }
    this._subscription = Observable.from(updates).subscribe(tree => {
      this._html = stringify(tree);
    });
  }

  unmount() {
    this._subscription.unsubscribe();
    this._subscription = null;
  }

  toString() {
    return this._html;
  }

  static renderToString(manager) {
    return renderContentManager(manager);
  }

}

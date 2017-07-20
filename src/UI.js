import { Element } from './Element.js';
import { DOMTarget } from './DOMTarget.js';
import { PushStream } from './PushStream.js';
import { Store } from './Store.js';
import * as symbols from './symbols.js';

class UIContext {

  constructor(ui) {
    this._ui = ui;
  }

  dispatchEvent(event, detail = null) {
    return this._ui.dispatchEvent(event, detail);
  }

}

export class UI {

  constructor() {
    this._target = null;
    this._pushStream = new PushStream();
    this._context = new UIContext(this);
    this._store = new Store();
    this._store.subscribe(() => this._renderToTarget());
  }

  get events() {
    return this._pushStream.observable;
  }

  get store() {
    return this._store;
  }

  dispatchEvent(event, detail = null) {
    if (typeof event === 'string') {
      event = { type: event, detail };
    }
    this._pushStream.push(event);
  }

  mount(target) {
    if (this._target) {
      throw new Error('UI instance already mounted');
    }
    if (typeof target === 'string' || target.nodeType) {
      target = new DOMTarget(target);
    }
    this._target = target;
    if (this.onMount) {
      this.onMount(target);
    }
    this._renderToTarget();
  }

  unmount() {
    if (this._target) {
      let target = this._target;
      this._target = null;
      if (this.onUnmount) {
        this.onUnmount(target);
      }
    }
  }

  getState(fn) {
    return this.store.read(fn);
  }

  updateState(data) {
    this.store.update(data);
  }

  render() {
    throw new Error('Missing render method for UI class');
  }

  _renderToTarget() {
    if (this._target) {
      this._target.patch(this._store.read(data => {
        return Element
          .from(this.render(data, this._context))
          .evaluate(this._context);
      }));
    }
  }

  static get targetElement() {
    throw new Error('Missing targetElement for UI class');
  }

  static [symbols.renderElement](props) {
    return new Element(this.targetElement, {
      key: props.key,
      contentManager: this,
    });
  }

}

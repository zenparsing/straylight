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
    this._store.subscribe(() => this.update());
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
    this.update();
    if (this.onMount) {
      this.onMount(target);
    }
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

  update() {
    if (this._target) {
      this._target.patch(this._store.read(data => {
        return Element
          .from(this.render(data, this._context))
          .evaluate(this._context);
      }));
    }
  }

  static [symbols.renderElement](props) {
    return new Element(this.targetElement || 'div', {
      key: props.key,
      updateChildren: false,
      onTargetCreated: (target, updates) => {
        let ui = new this();
        ui.store.update(props);
        ui.mount(target);
        updates.subscribe({
          next(props) { ui.store.update(props); },
          complete() { ui.unmount(); },
        });
      },
    });
  }

}

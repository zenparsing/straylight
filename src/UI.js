import Observable from 'zen-observable';
import { Element } from './Element.js';
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
    this._events = new PushStream();
    this._context = new UIContext(this);
    this._store = new Store();

    let updateStream = new PushStream();
    this._store.subscribe(() => updateStream.push(this._renderTree()));
    this._updates = new Observable(sink => {
      sink.next(this._renderTree());
      return updateStream.observable.subscribe(sink);
    });
  }

  get events() {
    return this._events.observable;
  }

  [symbols.observable]() {
    return this._updates;
  }

  get store() {
    return this._store;
  }

  dispatchEvent(event, detail = null) {
    if (typeof event === 'string') {
      event = { type: event, detail };
    }
    this._events.push(event);
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

  _renderTree() {
    return this._store.read(data => {
      return Element
        .from(this.render(data, this._context))
        .evaluate(this._context);
    });
  }

  static get targetElement() {
    throw new Error('Missing targetElement for UI class');
  }

  static mapPropsToState() {
    return null;
  }

  static [symbols.mapStateToContent](states) {
    let ui = new this();
    states.subscribe(state => ui.updateState(state));
    return ui;
  }

  static [symbols.renderElement](props, context) {
    return new Element(this.targetElement, {
      key: props.key,
      contentManager: this,
      contentManagerState: this.mapPropsToState(props, context),
    });
  }

}

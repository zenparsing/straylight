import Observable from 'zen-observable';
import PushStream from 'zen-push';
import { Element } from './Element.js';
import { Store } from './Store.js';
import * as symbols from './symbols.js';

class UIUpdate {

  constructor(ui) {
    this._ui = ui;
    this._element = null;
  }

  [symbols.element]() {
    if (!this._element) {
      this._element = this._ui.renderState();
      this._ui = null;
    }
    return this._element;
  }

}

export class UI {

  constructor() {
    this._store = new Store();
    this._context = null;
    this._updates = this._createUpdateObservable();
  }

  [symbols.observable]() {
    return this._updates;
  }

  getState(fn) {
    return this._store.read(fn);
  }

  setState(data) {
    this._store.update(data);
  }

  getContext() {
    return this._store.read(data => {
      let proto = data.parentContext || null;
      return Object.assign(Object.create(proto), this._context);
    });
  }

  setContext(data) {
    this._context = data;
  }

  render() {
    throw new Error('Missing render method for UI class');
  }

  // [Experimental]
  start() {
    return;
  }

  // [Experimental]
  pause() {
    return;
  }

  _createUpdateObservable() {
    let updateStream = new PushStream();
    this._store.subscribe(() => updateStream.next(new UIUpdate(this)));
    return new Observable(sink => {
      // [Experimental] Transitioning from not-observed => observed
      if (!updateStream.observed) {
        this.start();
      }
      // Send an update for the current state
      sink.next(new UIUpdate(this));
      let subscription = updateStream.observable.subscribe(sink);
      return () => {
        subscription.unsubscribe();
        // [Experimental] Transitioning from observed => not-observed
        if (!updateStream.observed) {
          this.pause();
        }
      };
    });
  }

  renderState() {
    return this._store.read(data => {
      let context = this.getContext();
      return Element.evaluate(this.render(data, context), context);
    });
  }

  static mapPropsToState(props, context) {
    return Object.assign({ parentContext: context }, props);
  }

  static get tagName() {
    let name = this.name.toLowerCase();
    if (!name || name === 'ui') {
      name = 'x';
    }
    return `ui-${ name }`;
  }

  static [symbols.mapStateToContent](states) {
    let ui = new this();
    states.subscribe(state => ui.setState(state));
    return ui;
  }

  static [symbols.render](props, context) {
    return new Element(this.tagName, {
      key: props.key,
      contentManager: this,
      contentManagerState: this.mapPropsToState(props, context),
    });
  }

}

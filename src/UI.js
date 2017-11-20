import Observable from 'zen-observable';
import { Element } from './Element.js';
import { Store } from './Store.js';
import * as symbols from './symbols.js';

class UIStore extends Store {
  constructor(ui) { super(); this._ui = ui; }
  start() { this._ui.start(); }
  pause() { this._ui.pause(); }
}

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
    this._context = null;
    this._store = new UIStore(this);
    this._updates = Observable.from(this._store).map(() => new UIUpdate(this));
  }

  [symbols.observable]() {
    return this._updates;
  }

  getState(fn) {
    return this._store.getState(fn);
  }

  setState(data) {
    this._store.setState(data);
  }

  getContext() {
    let context = Object.create(this.getState().parentContext || null);
    if (this._context) {
      for (let key in this._context) {
        context[key] = this._context[key];
      }
    }
    return context;
  }

  setContext(data) {
    this._context = data;
  }

  [symbols.render](state, context) {
    return this.render(state, context);
  }

  render() {
    throw new Error('Missing render method for UI class');
  }

  start() {
    return;
  }

  pause() {
    return;
  }

  renderState() {
    return Element.evaluate(new Element(this, this.getState()), this.getContext());
  }

  static mapPropsToState(props) {
    return props;
  }

  static [symbols.render](props, context) {
    let state = this.mapPropsToState(props, context);
    state.parentContext = context;
    return new Element('#document-fragment', {
      id: props.id,
      contentManager: this,
      contentManagerState: state,
    });
  }

}

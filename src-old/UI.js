import Observable from 'zen-observable';
import { Element } from './Element.js';
import { Store } from './Store.js';
import * as symbols from './symbols.js';

export class UI {

  constructor() {
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

  [symbols.render](props, children) {
    return this.render(props, children);
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
    let state = this.getState();
    return Element.evaluate(new Element(this, state, state.children));
  }

  static mapPropsToState(props) {
    return props;
  }

  static [symbols.render](props, children) {
    return new Element('#document-fragment', new UIProps(this, props, children));
  }

}

class UIStore extends Store {

  constructor(ui) {
    super();
    this._ui = ui;
  }

  start() {
    this._ui.start();
  }

  pause() {
    this._ui.pause();
  }

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

class UIProps {

  constructor(type, props, children) {
    this.type = type;
    this.state = type.mapPropsToState(props, children);
  }

  createComponent() {
    let ui = new this.type();
    this.updateComponent(ui);
    return ui;
  }

  updateComponent(ui) {
    ui.setState(this.state);
  }

}

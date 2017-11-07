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
    let parentContext = this.getState().parentContext || null;
    return Object.assign(Object.create(parentContext), this._context);
  }

  setContext(data) {
    this._context = data;
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
    let context = this.getContext();
    return Element.evaluate(this.render(state, context), context);
  }

  static mapPropsToState(props) {
    return props;
  }

  static get tagName() {
    let { name } = this;
    if (!name) { // IE11
      name = 'UI';
    }
    return `ui-${name === 'UI' ? 'x' : name.toLowerCase()}`;
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
      contentManagerState: Object.assign(
        { parentContext: context },
        this.mapPropsToState(props, context)
      ),
    });
  }

}

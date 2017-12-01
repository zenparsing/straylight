import Observable from 'zen-observable';
import { Element } from './Element.js';
import { Store } from './Store.js';
import * as symbols from './symbols.js';

export class UI {

  constructor() {
    this._context = null;
    this._parentContext = null;
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
    let context = Object.create(this._parentContext);
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

  [symbols.render](state, children, context) {
    return this.render(state, children, context);
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

  mapPropsToState() {
    return null;
  }

  static [symbols.render](props, children, context) {
    return new Element('#document-fragment', new UIProps(this, props, children, context));
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

  constructor(uiClass, props, children, context) {
    this.type = uiClass;
    this.props = props;
    this.children = children;
    this.context = context;
  }

  createdCallback(data) {
    data.contentStream = new this.type();
    this.updatedCallback(data);
  }

  updatedCallback(data) {
    let ui = data.contentStream;
    ui._parentContext = this.context;
    ui.setState(ui.mapPropsToState(this.props, this.children));
  }

}

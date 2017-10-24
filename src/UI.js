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

    let updateStream = new PushStream(this);
    this._store.subscribe(() => updateStream.next(new UIUpdate(this)));
    this._updates = new Observable(sink => {
      let subscription = updateStream.observable.subscribe(sink);
      sink.next(new UIUpdate(this));
      return subscription;
    });
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
    return this._store.read(data => Object.assign(
      Object.create(data.parentContext || null),
      this._context)
    );
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
    return this._store.read(data => {
      let context = this.getContext();
      return Element.evaluate(this.render(data, context), context);
    });
  }

  static mapPropsToState(props) {
    return props;
  }

  static get tagName() {
    let { name } = this;
    if (!name) { // IE11
      name = 'UI';
    }
    return `ui-${ name === 'UI' ? 'x' : name.toLowerCase() }`;
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

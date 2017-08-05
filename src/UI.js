import Observable from 'zen-observable';
import { Element } from './Element.js';
import { PushStream } from './PushStream.js';
import { Store } from './Store.js';
import * as symbols from './symbols.js';

class UIContext {
  constructor(ui) {
    this.dispatch = (event, detail = null) => ui.dispatchEvent(event, detail);
  }
}

class UIUpdate {
  constructor(ui) {
    this._ui = ui;
    this._tree = null;
  }

  render() {
    return this._tree || this._ui._renderTree();
  }
}

export class UI {

  constructor() {
    this._events = new PushStream();
    this._context = new UIContext(this);
    this._store = new Store();
    this._updates = this._createUpdateObservable();
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
    this._events.next(event);
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

  start() {
    return;
  }

  pause() {
    return;
  }

  _renderTree() {
    return this._store.read(data => {
      return Element
        .from(this.render(data, this._context))
        .evaluate(this._context);
    });
  }

  _createUpdateObservable() {
    let updateStream = new PushStream();
    this._store.subscribe(() => updateStream.next(new UIUpdate(this)));
    return new Observable(sink => {
      // Transitioning from not-observed => observed
      if (!updateStream.observed) {
        this.start();
      }
      // Send an update for the current state
      sink.next(new UIUpdate(this));
      let subscription = updateStream.observable.subscribe(sink);
      return () => {
        subscription.unsubscribe();
        // Transitioning from observed => not-observed
        if (!updateStream.observed) {
          this.pause();
        }
      };
    });
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
    return new Element('ui-container', {
      key: props.key,
      contentManager: this,
      contentManagerState: this.mapPropsToState(props, context),
    });
  }

}

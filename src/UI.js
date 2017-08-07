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
    this._element = null;
  }

  [symbols.element]() {
    return this._element || (this._element = Element.from(this._ui));
  }
}

export class UI {

  constructor() {
    this._events = new PushStream();
    this._store = new Store();
    this._context = new UIContext(this);
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

  [symbols.element]() {
    return this._store.read(data =>
      Element.evaluate(this.render(data, this._context), this._context)
    );
  }

  static mapPropsToState() {
    return null;
  }

  static [symbols.mapStateToContent](states) {
    let ui = new this();
    states.subscribe(state => ui.updateState(state));
    return ui;
  }

  static [symbols.render](props, context) {
    return new Element('ui-container', {
      key: props.key,
      contentManager: this,
      contentManagerState: this.mapPropsToState(props, context),
    });
  }

}

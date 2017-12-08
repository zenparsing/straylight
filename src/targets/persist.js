import Observable from 'zen-observable';
import { Element } from '../Element.js';
import { immediate } from '../Scheduler.js';
import * as symbols from '../symbols.js';

export function persist(updates, options) {
  return new Observable(sink =>
    toContentStream(updates).subscribe(new PersistenceObserver(sink, options))
  );
}

export function toContentStream(updates) {
  if (updates[symbols.element]) {
    return Observable.of(Element.evaluate(updates));
  }
  return Observable.from(updates);
}

class PersistenceObserver {

  constructor(sink, options = {}) {
    this.sink = sink;
    this.current = null;
    this.pending = null;
    this.queued = false;
    this.actions = options.actions || nullActions;
    this.root = options.root || null;
    this.scheduler = options.scheduler || immediate;
  }

  run() {
    if (this.subscription.closed) {
      return;
    }
    let tree = Element.from(this.pending);
    if (this.root) {
      this.root.children = [tree];
    }
    this.pending = null;
    this.visitRoot(this.current, tree);
    this.current = tree;
    this.queued = false;
    this.notify();
  }

  start(subscription) {
    this.subscription = subscription;
  }

  next(tree) {
    this.pending = tree;
    if (!this.queued) {
      this.queued = true;
      this.scheduler.enqueue(() => this.run());
    }
  }

  error(err) {
    this.sink.error(err);
  }

  complete() {
    this.sink.complete();
  }

  notify() {
    if (!this.queued) {
      this.sink.next(this.current);
    }
  }

  visitRoot(current, next) {
    if (current && !nodesMatch(current, next)) {
      this.removeNode(current, this.root);
      current = null;
    }
    if (current) {
      this.visitNode(current, next);
    } else {
      this.createNode(next, this.root, 0);
    }
  }

  createNode(element, parent, pos) {
    element.data = {};
    this.actions.onCreate(element, parent, pos);
    if (isComponentElement(element)) {
      this.createComponent(element);
    } else {
      for (let i = 0; i < element.children.length; ++i) {
        this.createNode(element.children[i], element, i);
      }
    }
    this.actions.onInsert(element, parent, pos);
  }

  removeNode(element, parent) {
    if (isComponentElement(element)) {
      this.removeComponent(element);
    }
    this.actions.onRemove(element, parent);
  }

  visitNode(current, next) {
    next.data = current.data;
    if (isComponentElement(next)) {
      this.updateComponent(current, next);
    } else {
      this.visitChildren(current, next);
    }
    this.actions.onUpdate(current, next);
  }

  visitChildren(current, next) {
    let nextList = next.children;
    let currentList = current.children;
    let from = 0;
    for (let i = 0; i < nextList.length; ++i) {
      let child = nextList[i];
      let matched = false;
      for (let j = from; j < currentList.length; ++j) {
        let node = currentList[j];
        if (!node.matched && nodesMatch(node, child)) {
          node.matched = true;
          this.visitNode(node, child);
          if (i !== j) {
            this.actions.onMove(child, next, i);
          }
          if (j === from) {
            from += 1;
          }
          matched = true;
          break;
        }
      }
      if (!matched) {
        this.createNode(child, next, i);
      }
    }
    for (let i = from; i < currentList.length; ++i) {
      let node = currentList[i];
      if (!node.matched) {
        this.removeNode(node, next);
      }
    }
  }

  createComponent(element) {
    let scheduler = this.scheduler;
    let actions = this.actions;
    let root = element;
    let component = element.props.createComponent();
    let updates = persist(component, { actions, root, scheduler });
    element.data.component = component;
    updates.subscribe(new ComponentObserver(element, this));
  }

  updateComponent(current, next) {
    next.children = current.children;
    next.props.updateComponent(next.data.component);
  }

  removeComponent(element) {
    element.data.componentSubscription.unsubscribe();
  }

}

class ComponentObserver {

  constructor(element, persistenceObserver) {
    this.data = element.data;
    this.persistenceObserver = persistenceObserver;
  }

  start(subscription) {
    this.data.componentSubscription = subscription;
  }

  next() {
    this.persistenceObserver.notify();
  }

}

const nullActions = {
  onCreate() {},
  onUpdate() {},
  onInsert() {},
  onMove() {},
  onRemove() {},
};

function isComponentElement(element) {
  return Boolean(element.props.createComponent);
}

function nodesMatch(a, b) {
  return a.tag === b.tag && (a.props.type || null) === (b.props.type || null);
}

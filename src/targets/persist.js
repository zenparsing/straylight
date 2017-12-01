import Observable from 'zen-observable';
import { immediate } from './Scheduler.js';
import { Element } from '../Element.js';
import * as symbols from '../symbols.js';

export function persist(updates, actions, options) {
  return new Observable(sink =>
    toContentStream(updates).subscribe(new PersistenceObserver(sink, actions, options))
  );
}

export function toContentStream(updates) {
  return updates[symbols.element] ? Observable.of(updates) : Observable.from(updates);
}

class PersistenceObserver {

  constructor(sink, actions, options = {}) {
    this.sink = sink;
    this.current = null;
    this.pending = null;
    this.queued = false;
    this.actions = actions;
    this.root = options.root || null;
    this.scheduler = options.scheduler || immediate;
  }

  run() {
    let tree = Element.from(this.pending);
    this.pending = null;
    this.visitRoot(this.current, tree);
    this.current = tree;
    this.queued = false;
    this.sink.next(this.current);
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
    let data = {};
    element.data = data;
    this.actions.onCreate(element, parent, pos);
    for (let i = 0; i < element.children.length; ++i) {
      this.createNode(element.children[i], element, i);
    }
    this.actions.onInsert(element, parent, pos);
    if (element.props.createdCallback) {
      element.props.createdCallback(data);
    }
    if (data.contentStream) {
      data.contentRoot = null;
      data.contentSubscription = persist(data.contentStream, this.actions, {
        root: element,
        scheduler: this.scheduler,
      }).subscribe(tree => {
        data.contentRoot = tree;
      });
    }
  }

  removeNode(element, parent) {
    this.actions.onRemove(element, parent);
    if (element.props.removedCallback) {
      element.props.removedCallback(element.data);
    }
    if (element.data.contentSubscription) {
      element.data.contentSubscription.unsubscribe();
      this.removeNode(element.data.contentRoot, element);
    }
  }

  visitNode(current, next) {
    next.data = current.data;
    this.actions.onUpdate(current, next);
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
    if (next.props.updatedCallback) {
      next.props.updatedCallback(next.data);
    }
  }

}

function nodesMatch(a, b) {
  return a.tag === b.tag && (a.props.type || null) === (b.props.type || null);
}

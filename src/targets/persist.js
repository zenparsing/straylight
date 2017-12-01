import Observable from 'zen-observable';
import { immediate } from './Scheduler.js';
import { Element } from '../Element.js';

export function persist(updates, actions, options) {
  return new Observable(sink =>
    updates.subscribe(new PersistenceObserver(sink, actions, options))
  );
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
    this.nodesMatch = options.nodesMatch || nodesMatch;
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
    if (current && !this.nodesMatch(current, next)) {
      this.actions.onRemove(current, this.root);
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
    for (let i = 0; i < element.children.length; ++i) {
      this.createNode(element.children[i], element, i);
    }
    this.actions.afterCreate(element, parent, pos);
    this.actions.onInsert(element, parent, pos);
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
        if (!node.matched && this.nodesMatch(node, child)) {
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
        this.actions.onRemove(node, next);
      }
    }
    this.actions.afterUpdate(current, next);
  }

}

function nodesMatch(a, b) {
  return a.tag === b.tag && (a.props.id || '') === (b.props.id || '');
}

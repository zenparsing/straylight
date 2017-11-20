import Observable from 'zen-observable';
import { immediate } from './Scheduler.js';
import { Element } from '../Element.js';
import * as symbols from '../symbols.js';

export function diff(updates, options) {
  return new Observable(sink => {
    let stream = updates[symbols.element] ?
      Observable.of(updates) :
      Observable.from(updates);

    return stream.subscribe(new DiffObserver(sink, options));
  });
}

function annotate(node) {
  if (!node.diff) {
    node.diff = [];
  }
  for (let i = 1; i < arguments.length; ++i) {
    node.diff.push(arguments[i]);
  }
}

class AnnotateActions {
  create(node) { annotate(node, 'create'); }
  replace(current, next) { annotate(next, 'replace', current); }
  setProp(node, key) { annotate(node, 'setprop', key); }
  removeProp(node, key) { annotate(node, 'removeprop', key); }
  moveChild(parent, pos) { annotate(parent, 'moveChild', pos); }
  insertChild(parent, pos) { annotate(parent, 'insertchild', pos); }
  removeChild(parent, node) { annotate(parent, 'removechild', node); }
}

class DiffObserver {

  constructor(sink, options = {}) {
    this.sink = sink;
    this.current = null;
    this.pending = null;
    this.queued = false;
    this.scheduler = options.scheduler || immediate;
    this.actions = options.actions || new AnnotateActions();
  }

  runDiff() {
    let tree = Element.from(this.pending);
    this.pending = null;
    this.diffRoot(this.current, tree);
    this.current = tree;
    this.notify();
    this.queued = false;
  }

  notify() {
    this.sink.next(this.current);
  }

  next(tree) {
    this.pending = tree;
    if (!this.queued) {
      this.queued = true;
      this.scheduler.enqueue(() => this.runDiff());
    }
  }

  error(err) {
    this.sink.error(err);
  }

  complete() {
    this.sink.complete();
  }

  validateNode(node) {
    if (typeof node.tag !== 'string') {
      throw new Error(`Invalid element tag ${node.tag}`);
    }
  }

  diffRoot(current, next) {
    this.validateNode(next);
    if (!current) {
      this.actions.create(next);
      this.onCreate(next);
    } else if (!compatible(current, next)) {
      this.actions.replace(current, next);
      this.onCreate(next);
      this.onRemove(current);
    } else {
      this.diffNode(current, next);
    }
  }

  diffNode(current, next) {
    this.diffProps(current, next);
    if (!next.props.contentManager) {
      this.diffChildren(current, next);
    }
    this.onUpdate(next);
  }

  diffProps(current, next) {
    let seen = new Set();
    for (let key in next.props) {
      seen.add(key);
      if (!isMagicProp(key) && current.props[key] !== next.props[key]) {
        this.actions.setProp(next, key);
      }
    }
    for (let key in current.props) {
      if (!seen.has(key)) {
        this.actions.removeProp(next, key);
      }
    }
  }

  diffChildren(current, next) {
    let currentList = current.children;
    let nextList = next.children;
    for (let i = 0; i < nextList.length; ++i) {
      let child = nextList[i];
      let matched = false;
      this.validateNode(child);
      for (let j = 0; j < currentList.length; ++j) {
        let node = currentList[j];
        if (node && compatible(node, child)) {
          if (i !== j) {
            this.actions.moveChild(next, j);
          }
          currentList[j] = null;
          matched = true;
          this.diffNode(node, child);
          break;
        }
      }
      if (!matched) {
        this.actions.insertChild(next, i);
        this.onCreate(child);
      }
    }
    for (let i = 0; i < currentList.length; ++i) {
      let node = currentList[i];
      if (node) {
        this.actions.removeChild(next, node);
        this.onRemove(node);
      }
    }
  }

  onCreate(node) {
    let props = node.props;
    if (props.contentManager) {
      let manager = new props.contentManager();
      let observer = new ChildDiffObserver(this, node, manager);
      manager.setState(props.contentManagerState);
      let options = { scheduler: this.scheduler, actions: this.actions };
      diff(manager, options).subscribe(observer);
      node.contentManagerObserver = observer;
    }
  }

  onUpdate(current, next) {
    let observer = current.contentManagerObserver;
    if (observer) {
      next.contentManagerObserver = observer;
      observer.root = next;
      observer.setState(next.props.contentManagerState);
    }
  }

  onRemove(node) {
    let observer = node.contentManagerObserver;
    if (observer) {
      observer.subscription.unsubscribe();
    }
  }

}

class ChildDiffObserver {

  constructor(parent, root, manager) {
    this.parent = parent;
    this.root = root;
    this.manager = manager;
    this.subscription = null;
  }

  setState(state) {
    this.manager.setState(state);
  }

  start(s) {
    this.subscription = s;
  }

  next(tree) {
    this.root.children = tree.tag === '#document-fragment' ? tree.children : [tree];
    this.parent.notify(); // TODO: timing?
  }

  error(e) {
    this.parent.sink.error(e);
  }

}

function isMagicProp(name) {
  return name === 'children';
}

function compatible(a, b) {
  // TODO: input elements with different type attributes? should we pass in a
  // compat tester?
  return (
    a.tag === b.tag &&
    (a.props.id || '') === (b.props.id || '') &&
    (a.props.contentManager || null) === (b.props.contentManager || null)
  );
}

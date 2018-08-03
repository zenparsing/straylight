import * as vdom from '../src/extras/vdom.js';

export function createDocument(reporter) {
  let doc = vdom.createDocument();
  return {
    createElement(tag) {
      reporter.push({ name: 'createElement', action: 'call' });
      return instrument(doc.createElement(tag), reporter);
    },
    createElementNS(namespace, tag) {
      reporter.push({ name: 'createElementNS', action: 'call' });
      return instrument(doc.createElementNS(namespace, tag), reporter)
    },
    createTextNode(text) {
      reporter.push({ name: 'createTextNode', action: 'call' });
      return instrument(doc.createTextNode(text), reporter);
    },
  };
}

function instrument(obj, reporter) {
  for (let [name, desc] of allProperties(obj)) {
    Object.defineProperty(obj, name, {
      get() {
        reporter.push({ name, action: 'get' });
        let value = desc.get ? desc.get.call(this) : desc.value;
        if (typeof value === 'function') {
          return function(...args) {
            reporter.push({ name, action: 'call' });
            return value.apply(this, args);
          };
        }
        return value;
      },
      set(value) {
        reporter.push({ name, action: 'get' });
        if (desc.set) {
          desc.set.call(this, value);
        } else {
          desc.value = value;
        }
      },
      enumerable: desc.enumerable,
      configurable: true,
    });
  }
  return obj;
}

function allProperties(obj) {
  let props = new Map();
  for (; obj; obj = Object.getPrototypeOf(obj)) {
    Object.getOwnPropertyNames(obj).forEach(name => {
      if (!props.has(name)) {
        props.set(name, Object.getOwnPropertyDescriptor(obj, name));
      }
    });
  }
  return props;
}

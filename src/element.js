import * as symbols from './symbols.js';

export class Element {

  constructor(tag, props = {}, children = []) {
    // Copy props
    props = Object.assign({}, props);
    // Enforce props.children === children
    if (children.length === 0 && Array.isArray(props.children)) {
      children = props.children;
    } else {
      props.children = children;
    }
    this.tag = tag;
    this.props = props;
    this.children = children.map(Element.from);
  }

  evaluate(context) {
    let node = this;
    // Execute rendering functions
    while (typeof node.tag !== 'string') {
      let render;
      let receiver;
      if (node.tag && node.tag[symbols.renderElement]) {
        render = node.tag[symbols.renderElement];
        receiver = node.tag;
      } else {
        render = node.tag;
        receiver = undefined;
      }
      if (typeof render !== 'function') {
        throw new Error(`${render} is not a valid render function`);
      }
      node = Element.from(render.call(receiver, this.props, context));
    }
    if (node === this) {
      node = new Element(node.tag, node.props, node.children);
    } else {
      // Propagate key to rendered element
      if (this.props.key && !node.props.key) {
        node.props.key = this.props.key;
      }
    }
    // Evaluate children
    node.children = node.children.map(child => child.evaluate(context));
    return node;
  }

  static from(x) {
    if (x === null || x === undefined) {
      return new Element('#text', { text: '' });
    } else if (typeof x !== 'object') {
      return new Element('#text', { text: String(x) });
    } else if (x instanceof Element) {
      return x;
    } else if (Array.isArray(x)) {
      return new Element('#document-fragment', {}, x);
    }
    throw new Error(`Cannot convert ${ x } to an Element`);
  }

}

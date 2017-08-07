import * as symbols from './symbols.js';

export class Element {

  constructor(tag, props = {}, children = []) {
    // Copy props
    props = { ...props };

    // Enforce props.children === children
    if (children.length === 0 && Array.isArray(props.children)) {
      children = props.children;
    } else {
      props.children = children;
    }

    // Convert children to elements
    children = children.map(Element.from);

    this.tag = tag;
    this.props = props;
    this.children = children;
  }

  [symbols.element]() {
    return this;
  }

  static evaluate(source, context) {
    let element = Element.from(source);
    let node = element;

    // Execute rendering functions
    while (typeof node.tag !== 'string') {
      let receiver = undefined;
      let render = node.tag;
      if (render && render[symbols.render]) {
        receiver = render;
        render = render[symbols.render];
      }
      if (typeof render !== 'function') {
        throw new TypeError(`${render} is not a function`);
      }
      node = Element.from(render.call(receiver, node.props, context));
    }

    if (node === element) {
      // Ensure non-mutation
      node = new Element(node.tag, node.props, node.children);
    } else {
      // Propagate key to rendered element
      if (element.props.key && !node.props.key) {
        node.props.key = element.props.key;
      }
    }

    // Evaluate children
    node.children = node.children.map(child => Element.evaluate(child, context));

    return node;
  }

  static from(source) {
    if (source === null || source === undefined) {
      return new Element('#text', { text: '' });
    } else if (typeof source === 'string' || typeof source === 'number') {
      return new Element('#text', { text: source });
    } else if (Array.isArray(source)) {
      return new Element('#document-fragment', {}, source);
    } else if (source[symbols.element]) {
      return source[symbols.element]();
    }
    throw new TypeError(`Cannot convert ${ source } to an Element`);
  }

}

import * as symbols from './symbols.js';

export class Element {

  constructor(tag, props, children) {
    this.tag = tag;
    this.props = props || {};
    this.children = children || [];
  }

  [symbols.element]() {
    return this;
  }

  static evaluate(source, context) {
    let element = Element.from(source);
    let node = element;

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
      node = Element.from(render.call(receiver, node.props, node.children, context));
    }

    for (let i = 0; i < node.children.length; ++i) {
      node.children[i] = Element.evaluate(node.children[i], context);
    }

    return node;
  }

  static from(source) {
    if (source === null || source === undefined) {
      return new Element('#text', { value: '' });
    } else if (
      typeof source === 'string' ||
      typeof source === 'number' ||
      typeof source === 'boolean'
    ) {
      return new Element('#text', { value: String(source) });
    } else if (Array.isArray(source)) {
      return new Element('#document-fragment', {}, source);
    } else if (source[symbols.element]) {
      return source[symbols.element]();
    }
    throw new TypeError(`Cannot convert ${ source } to an Element`);
  }

}

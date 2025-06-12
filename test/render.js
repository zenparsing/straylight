import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/vdom.js';

const svgNamespace = 'http://www.w3.org/2000/svg';

describe('Render', () => {
  let document = createDocument();

  it('throws if tagname is a template value', () => {
    assert.throws(() => {
      applyTemplate(document.createElement('div'), html`<${ 'div' } />`);
    });
  });

  it('throws if target is not a DOM element', () => {
    assert.throws(() => {
      applyTemplate({}, html`x`);
    });
  });

  it('throws if argument is a string and window is not available', () => {
    assert.throws(() => {
      applyTemplate('#main', html`x`);
    });
  });

  it('uses querySelector if argument is a string and window is available', () => {
    let selector = null;
    global.document = {
      querySelector(s) {
        selector = s;
        return document.createElement('div');
      },
    };
    try {
      applyTemplate('#mount', html`x`);
      assert.strictEqual(selector, '#mount');
    } finally {
      global.document = undefined;
    }
  });

  it('accepts text-like values', () => {
    let target = document.createElement('div');
    applyTemplate(target, null);
    assert.deepStrictEqual(target.toDataObject().childNodes, []);
    applyTemplate(target, 'hello');
    assert.deepStrictEqual(target.toDataObject().childNodes, ['hello']);
    applyTemplate(target, 0);
    assert.deepStrictEqual(target.toDataObject().childNodes, ['0']);
  });

  it('removes content on first render', () => {
    let target = document.createElement('div');
    target.appendChild(document.createElement('div'));
    target.appendChild(document.createElement('div'));
    applyTemplate(target, html`<span></span>`);
    assert.deepStrictEqual(target.toDataObject(), {
      nodeName: 'div',
      attributes: {},
      childNodes: [{
        nodeName: 'span',
        attributes: {},
        childNodes: [],
      }],
    });
  });

  it('renders svg into an HTML element', () => {
    let target = document.createElement('div');
    applyTemplate(target, html`<svg><path /></svg>`);
    let elem = target.firstElementChild;
    assert.deepStrictEqual(elem.toDataObject(), {
      nodeName: 'svg',
      attributes: {},
      childNodes: [
        { nodeName: 'path', attributes: {}, childNodes: [] },
      ],
    });
    assert.strictEqual(elem.namespaceURI, svgNamespace);
    assert.strictEqual(elem.firstChild.namespaceURI, svgNamespace);
  });

  it('renders svg into an svg element', () => {
    let target = document.createElementNS(svgNamespace, 'svg');
    applyTemplate(target, html`<path />`);
    let elem = target.firstElementChild;
    assert.deepStrictEqual(elem.toDataObject(), {
      nodeName: 'path',
      attributes: {},
      childNodes: [],
    });
    assert.strictEqual(elem.namespaceURI, 'http://www.w3.org/2000/svg');
  });
});

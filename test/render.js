import * as assert from 'assert';
import { describe, it } from './testing.js';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/extras/vdom.js';

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

  it('throws if template is not a TemplateResult object', () => {
    assert.throws(() => {
      applyTemplate(document.createElement('div', {}));
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
      assert.equal(selector, '#mount');
    } finally {
      global.document = undefined;
    }
  });

  it('removes content on first render', () => {
    let target = document.createElement('div');
    target.appendChild(document.createElement('div'));
    target.appendChild(document.createElement('div'));
    applyTemplate(target, html`<span></span>`);
    assert.deepEqual(target.toDataObject(), {
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
    assert.deepEqual(elem.toDataObject(), {
      nodeName: 'svg',
      attributes: {},
      childNodes: [
        { nodeName: 'path', attributes: {}, childNodes: [] },
      ],
    });
    assert.equal(elem.namespaceURI, svgNamespace);
    assert.equal(elem.firstChild.namespaceURI, svgNamespace);
  });

  it('renders svg into an svg element', () => {
    let target = document.createElementNS(svgNamespace, 'svg');
    applyTemplate(target, html`<path />`);
    let elem = target.firstElementChild;
    assert.deepEqual(elem.toDataObject(), {
      nodeName: 'path',
      attributes: {},
      childNodes: [],
    });
    assert.equal(elem.namespaceURI, 'http://www.w3.org/2000/svg');
  });
});

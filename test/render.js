import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';

const svgNamespace = 'http://www.w3.org/2000/svg';

describe('Render', () => {
  let document = new vdom.Document();

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
    global.window = {
      document: {
        querySelector(s) {
          selector = s;
          return document.createElement('div');
        },
      },
    };
    try {
      applyTemplate('#mount', html`x`);
      assert.equal(selector, '#mount');
    } finally {
      global.window = undefined;
    }
  });

  it('renders svg into an HTML element', () => {
    let target = document.createElement('div');
    applyTemplate(target, html`<svg><path /></svg>`);
    let elem = target.childNodes[1];
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
    let elem = target.childNodes[1];
    assert.deepEqual(elem.toDataObject(), {
      nodeName: 'path',
      attributes: {},
      childNodes: [],
    });
    assert.equal(elem.namespaceURI, 'http://www.w3.org/2000/svg');
  });
});

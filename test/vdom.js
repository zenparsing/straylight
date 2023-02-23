import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { createDocument } from '../src/vdom.js';

describe('vdom', () => {
  let document = createDocument();

  function create(tag = 'div') {
    return document.createElement(tag);
  }

  function createText(text = '') {
    return document.createTextNode(text);
  }

  describe('Node', () => {
    describe('previousElementSibling', () => {
      it('returns the first element sibling', () => {
        let elem = create();
        let child = create();
        elem.appendChild(create());
        elem.appendChild(createText());
        elem.appendChild(child);
        assert.strictEqual(elem.firstChild.nextElementSibling, child);
      });

      it('returns null if there are no next element siblings', () => {
        let elem = create();
        elem.appendChild(create());
        elem.appendChild(createText());
        assert.strictEqual(elem.firstChild.nextElementSibling, null);
      });
    });

    describe('nextElementSibling', () => {
      it('returns the previous element child', () => {
        let elem = create();
        let child = create();
        elem.appendChild(child);
        elem.appendChild(createText());
        elem.appendChild(create());
        assert.strictEqual(elem.lastChild.previousElementSibling, child);
      });

      it('returns null if there are no previous element siblings', () => {
        let elem = create();
        elem.appendChild(createText());
        elem.appendChild(create());
        assert.strictEqual(elem.lastChild.previousElementSibling, null);
      });
    });
  });

  describe('ParentNode', () => {
    describe('removeChild', () => {
      it('throws if the node is not a child', () => {
        let elem = create();
        let node = create();
        assert.throws(() => {
          elem.removeChild(node);
        });
      });

      it('sets nextSibling of the previous child', () => {
        let elem = create();
        elem.insertBefore(create(), null);
        elem.insertBefore(create(), null);
        elem.insertBefore(create(), null);
        elem.removeChild(elem.firstElementChild);
        assert.strictEqual(elem.firstChild.nextSibling, elem.lastChild);
      });
    });

    describe('insertBefore', () => {
      it('results in no change when the new node is identical to the next node', () => {
        let elem = create();
        let node = create('span');
        elem.insertBefore(node, null);
        elem.insertBefore(node, node);
        assert.deepStrictEqual(elem.toDataObject().childNodes, [
          { nodeName: 'span', attributes: {}, childNodes: [] },
        ]);
      });

      it('throws if the next node is not a child', () => {
        let elem = create();
        let node = create();
        assert.throws(() => {
          elem.insertBefore(create(), node);
        });
      });
    });

    describe('firstElementChild', () => {
      it('returns the first element child', () => {
        let elem = create();
        let child = create();
        elem.appendChild(createText());
        elem.appendChild(child);
        assert.strictEqual(elem.firstElementChild, child);
      });

      it('returns null if there are no element children', () => {
        let elem = create();
        elem.appendChild(createText());
        assert.strictEqual(elem.firstElementChild, null);
      });
    });

    describe('lastElementChild', () => {
      it('returns the last element child', () => {
        let elem = create();
        let child = create();
        elem.appendChild(child);
        elem.appendChild(createText());
        assert.strictEqual(elem.lastElementChild, child);
      });

      it('returns null if there are no element children', () => {
        let elem = create();
        elem.appendChild(createText());
        assert.strictEqual(elem.lastElementChild, null);
      });
    });
  });

  describe('Element', () => {
    describe('getAttribute', () => {
      it('gets the current attribute value', () => {
        let elem = create();
        elem.setAttribute('x', 'a');
        assert.strictEqual(elem.getAttribute('x'), 'a');
      });

      it('returns null if the attribute is not present', () => {
        let elem = create();
        assert.strictEqual(elem.getAttribute('x'), null);
      });

      it('converts keys to string', () => {
        let elem = create();
        elem.setAttribute('1', 'a');
        assert.strictEqual(elem.getAttribute(1), 'a');
      });
    });

    describe('setAttribute', () => {
      it('sets the current attribute value', () => {
        let elem = create();
        elem.setAttribute('x', 'a');
        assert.strictEqual(elem.getAttribute('x'), 'a');
      });

      it('converts keys and values to string', () => {
        let elem = create();
        elem.setAttribute(1, 2);
        assert.strictEqual(elem.getAttribute('1'), '2');
      });
    });

    describe('hasAttribute', () => {
      it('returns true if the attribute is set', () => {
        let elem = create();
        elem.setAttribute('x', 'a');
        assert.strictEqual(elem.hasAttribute('x'), true);
      });

      it('returns false if the attribute is not set', () => {
        let elem = create();
        assert.strictEqual(elem.hasAttribute('x'), false);
      });

      it('converts keys to string', () => {
        let elem = create();
        elem.setAttribute('1', 'a');
        assert.strictEqual(elem.hasAttribute(1), true);
      });
    });

    describe('removeAttribute', () => {
      it('removes the attribute from the element', () => {
        let elem = create();
        elem.setAttribute('x', 'a');
        elem.removeAttribute('x');
        assert.strictEqual(elem.hasAttribute('x'), false);
      });

      it('converts keys to string', () => {
        let elem = create();
        elem.setAttribute('1', 'a');
        elem.removeAttribute(1);
        assert.strictEqual(elem.hasAttribute('1'), false);
      });
    });
  });
});

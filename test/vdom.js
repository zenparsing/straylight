import { vdom } from '../src/extras';
import assert from 'assert';

describe('vdom', () => {
  let document = new vdom.Document();

  describe('parentNode.removeChild', () => {
    it('throws if the node is not a child', () => {
      let elem = document.createElement('div');
      let node = document.createElement('span');
      assert.throws(() => {
        elem.removeChild(node);
      });
    });

    it('sets nextSibling of the previous child', () => {
      let elem = document.createElement('div');
      elem.insertBefore(document.createElement('span'), null);
      elem.insertBefore(document.createElement('span'), null);
      elem.insertBefore(document.createElement('span'), null);
      elem.removeChild(elem.firstElementChild);
      assert.equal(elem.firstChild.nextSibling, elem.lastChild);
    });
  });

  describe('parentNode.insertBefore', () => {
    it('works when the new node is identical to the next node', () => {
      let elem = document.createElement('div');
      let node = document.createElement('span');
      elem.insertBefore(node, null);
      elem.insertBefore(node, node);
      assert.deepEqual(elem.toDataObject().childNodes, [
        { nodeName: 'span', attributes: {}, childNodes: [] },
      ]);
    });
  });
});

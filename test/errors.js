import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';

describe('Errors', () => {
  let document = new vdom.Document();

  it('throws if tagname is a template value', () => {
    assert.throws(() => {
      applyTemplate(document.createElement('div'), html`<${ 'div' } />`);
    });
  });
});

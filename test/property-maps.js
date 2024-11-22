import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { html, applyTemplate } from '../src/index.js';
import { createDocument } from '../src/vdom.js';

describe('Property map updaters', () => {
  let document = createDocument();

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let { firstElementChild } = target;
    for (let [key, value] of Object.entries(expected)) {
      if (key === 'className' || key === 'id') {
        assert.strictEqual(firstElementChild[key], value);
      } else {
        assert.strictEqual(firstElementChild.getAttribute(key), value);
      }
    }
  }

  it('assigns object keys to known properties', () => {
    assertResult(html`<div ${{ className: '1', id: '2' }} />`, {
      className: '1',
      id: '2',
    });
  });

  it('assigns attributes values for unknown properties', () => {
    assertResult(html`<div ${{ x: '1', y: '2' }} />`, {
      x: '1',
      y: '2',
    });
  });

  it('ignores null and undefined', () => {
    assertResult(html`<div ${null} />`, {});
    assertResult(html`<div ${undefined} />`, {});
  });

  it('throws if the value is a non-object', () => {
    assert.throws(() => {
      applyTemplate(document.createElement('div'), html`<div ${0} />`);
    });
  });

  it('executes functions', () => {
    assertResult(html`<div ${() => ({ className: '1', y: 2 })} />`, {
      className: '1',
      y: '2',
    });
  });

});

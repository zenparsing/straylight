import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';

describe('Attribute updaters', () => {
  let document = new vdom.Document();

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.childNodes[0].toDataObject().attributes;
    assert.deepEqual(actual, expected);
  }

  it('assigns object keys', () => {
    assertResult(html`<div x=${1} />`, { x: '1' });
  });

  it('set properties when name starts with dot', () => {
    let target = document.createElement('div');
    applyTemplate(target, html`<div .testName=${'value'} />`);
    assert.equal(target.childNodes[0].testName, 'value');
  });

  it('removes attributes whose value is undefined', () => {
    function render(value) {
      return html`<div x=${value} />`;
    }
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    let elem = target.childNodes[0];
    assert.equal(elem.attributes.get('x'), 'a');
    applyTemplate(target, render(undefined));
    assert.ok(!elem.attributes.has('x'));
  });

  it('removes attributes whose value is false', () => {
    function render(value) {
      return html`<div x=${value} />`;
    }
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    let elem = target.childNodes[0];
    assert.equal(elem.attributes.get('x'), 'a');
    applyTemplate(target, render(false));
    assert.ok(!elem.attributes.has('x'));
  });

  it('uses the attribute name for boolean attribute values', () => {
    assertResult(html`<div x=${true} />`, {
      x: 'x',
    });
  });

});

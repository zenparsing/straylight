import { html, applyTemplate } from '../src';
import { vdom } from '../src/extras';
import assert from 'assert';

describe('Attribute updaters', () => {
  let document = new vdom.Document();
  let render = val => html`<div x=${val} />`;

  function assertResult(template, expected) {
    let target = document.createElement('div');
    applyTemplate(target, template);
    let actual = target.firstElementChild.toDataObject().attributes;
    assert.deepEqual(actual, expected);
  }

  it('assigns attribute values', () => {
    assertResult(render(1), { x: '1' });
  });

  it('assigns consecutive identical values', () => {
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    applyTemplate(target, render('a'));
    assert.equal(target.firstElementChild.attributes.get('x'), 'a');
  });

  it('set properties when name starts with dot', () => {
    let target = document.createElement('div');
    applyTemplate(target, html`<div .testName=${'value'} />`);
    assert.equal(target.firstElementChild.testName, 'value');
  });

  it('removes attributes whose value is undefined', () => {
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    let elem = target.firstElementChild;
    assert.equal(elem.attributes.get('x'), 'a');
    applyTemplate(target, render(undefined));
    assert.ok(!elem.attributes.has('x'));
  });

  it('removes attributes whose value is false', () => {
    let target = document.createElement('div');
    applyTemplate(target, render('a'));
    let elem = target.firstElementChild;
    assert.equal(elem.attributes.get('x'), 'a');
    applyTemplate(target, render(false));
    assert.ok(!elem.attributes.has('x'));
  });

  it('uses the attribute name for boolean attribute values', () => {
    assertResult(render(true), { x: 'x' });
  });

});

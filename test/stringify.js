import * as assert from 'assert';
import { describe, it } from 'moon-unit';
import { html } from '../src/index.js';
import { stringify } from '../src/extras/index.js';

describe('HTML stringification', () => {
  it('serializes to HTML', () => {
    assert.strictEqual(stringify(html`
      <div class='x'>
        <span>1</span>
      </div>
      <div class='y'>
        <span>2</span>
      </div>
    `), `<div class="x">
        <span>1</span>
      </div>
      <div class="y">
        <span>2</span>
      </div>`);
  });

  it('escapes text', () => {
    assert.strictEqual(stringify(html`<x>&</x>`), '<x>&amp;</x>');
  });

  it('does not escape text in raw tags', () => {
    assert.strictEqual(stringify(html`<script>&</script>`), '<script>&</script>');
  });

  it('self-closes void tags', () => {
    assert.strictEqual(stringify(html`<x><br /></x>`), '<x><br /></x>');
  });

  it('generates closing tags for non-void tags', () => {
    assert.strictEqual(stringify(html`<x a=1 />`), '<x a="1"></x>');
  });

  it('does not stringify property maps', () => {
    assert.strictEqual(stringify(html`<x ${{ a: 1, b: 2 }} />`), '<x></x>');
  });

  it('stringifies attribute parts', () => {
    assert.strictEqual(stringify(html`<x a="foo ${ 'bar' } baz" />`), '<x a="foo bar baz"></x>');
  });

  it('stringifies flag attributes', () => {
    assert.strictEqual(
      stringify(html`<x a b=${true} c=${null} d=${undefined} e=${false} />`),
      '<x a="a" b="b"></x>'
    );
  });

  it('does not stringify comments', () => {
    assert.strictEqual(
      stringify(html`<div><!-- before ${1} after -->${2}</div>`),
      '<div>2</div>'
    );
  });
});

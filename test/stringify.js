import { html } from '../src';
import { stringify } from '../src/extras';
import assert from 'assert';

describe('HTML stringification', () => {
  it('serializes to HTML', () => {
    assert.equal(stringify(html`
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
    assert.equal(stringify(html`<x>&</x>`), '<x>&amp;</x>');
  });

  it('does not escape text in raw tags', () => {
    assert.equal(stringify(html`<script>&</script>`), '<script>&</script>');
  });

  it('self-closes void tags', () => {
    assert.equal(stringify(html`<x><br /></x>`), '<x><br /></x>');
  });

  it('generates closing tags for non-void tags', () => {
    assert.equal(stringify(html`<x a=1 />`), '<x a="1"></x>');
  });

  it('stringifies attribute maps', () => {
    assert.equal(stringify(html`<x ${{ a: 1, b: 2 }} />`), '<x a="1" b="2"></x>');
  });

  it('stringifies attribute parts', () => {
    assert.equal(stringify(html`<x a="foo ${ 'bar' } baz" />`), '<x a="foo bar baz"></x>');
  });

  it('stringifies flag attributes', () => {
    assert.equal(
      stringify(html`<x a b=${true} c=${null} d=${undefined} e=${false} />`),
      '<x a="a" b="b"></x>'
    );
  });

  it('does not stringify comments', () => {
    assert.equal(
      stringify(html`<div><!-- before ${1} after -->${2}</div>`),
      '<div>2</div>'
    );
  });
});

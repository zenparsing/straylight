import { html } from '../src';
import { stringify } from '../src/extras';
import assert from 'assert';

describe('HTML stringification', () => {
  it('should serialize to HTML', () => {
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

  it('should escape text', () => {
    assert.equal(stringify(html`<x>&</x>`), '<x>&amp;</x>');
  });

  it('should not escape text in raw tags', () => {
    assert.equal(stringify(html`<script>&</script>`), '<script>&</script>');
  });

  it('should self-close void tags', () => {
    assert.equal(stringify(html`<x><br /></x>`), '<x><br /></x>');
  });

  it('should generate closing tags for non-void tags', () => {
    assert.equal(stringify(html`<x a=1 />`), '<x a="1"></x>');
  });

  it('should stringify attribute maps', () => {
    assert.equal(stringify(html`<x ${{ a: 1, b: 2 }} />`), '<x a="1" b="2"></x>');
  });

  it('should stringify attribute parts', () => {
    assert.equal(stringify(html`<x a="foo ${ 'bar' } baz" />`), '<x a="foo bar baz"></x>');
  });

  it('should not stringify comments', () => {
    assert.equal(
      stringify(html`<div><!-- before ${1} after -->${2}</div>`),
      '<div>2</div>'
    );
  });
});

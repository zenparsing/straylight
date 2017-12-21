const { html } = require('../');
const { stringify } = require('../extras');
const assert = require('assert');

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
});

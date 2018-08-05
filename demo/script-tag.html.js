import { html, applyTemplate } from '../dist/straylight.js';

window.onload = () => {
  function render() {
    return html`
      <script>
        alert('hello world');
      </script>
    `;
  }
  applyTemplate('#mount', render());
};

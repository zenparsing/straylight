window.onload = () => {
  const { html, applyTemplate } = Straylight;
  function render() {
    return html`
      <script>
        alert('hello world');
      </script>
    `;
  }
  applyTemplate('#mount', render());
};

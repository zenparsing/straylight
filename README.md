# Straylight

A templating and rendering library for HTML and other tag-based markup languages.

## About

As a web developer, how can I dynamically update an HTML document in a way that is **safe**, **simple**, **readable**, and **efficient**?

Straylight solves this problem by providing:

- **A Javascript template tag** for rendering lightweight document fragments
- **An update engine** for applying a series of fragments to the HTML document over time


## Examples

### 1. Hello World

```html
<div id='mount'></div>
<script src='https://cdn.jsdelivr.net/npm/straylight/dist/straylight.js'></script>
<script>

window.onload = () => {
  const { html, renderToDOM } = Straylight;
  const world = 'Earth';

  renderToDOM('#mount', html`
    <h1>Hello ${world}</h1>
    <p>How are you?</p>
  `);
};

</script>
```

### 2. Stateful Components

```js
import { html, UI } from 'straylight';

class Clock extends UI {

  constructor() {
    super();
    this.setState({ now: Date.now() });
  }

  start() {
    this._interval = setInterval(() => {
      this.setState({ now: Date.now() });
    }, 1000);
  }

  pause() {
    clearInterval(this._interval);
  }

  render({ now }) {
    return html`
      <div class='clock'>
        ${new Date(now).toLocaleString()}
      </div>
    `;
  }

}
```

## Install

```sh
npm install straylight
```

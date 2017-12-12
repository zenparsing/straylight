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
<script src='https://cdn.jsdelivr.net/npm/straylight/dist/straylight.min.js'></script>
<script>

window.onload = () => {
  const { html, updateDOM } = Straylight;
  const world = 'Earth';

  updateDOM('#mount', html`
    <h1>Hello ${world}</h1>
    <p>How are you?</p>
  `);
};

</script>
```

## Install

```sh
npm install straylight
```

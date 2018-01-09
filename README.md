# Straylight

A templating and rendering library for HTML.

## About

As a web developer, how can I dynamically update an HTML document in a way that is **safe**, **simple**, **readable**, and **efficient**?

&#x1f914;

Over the years, web developers have approached this problem in many different ways:

- JQuery's `html` method
- Underscore templates
- Handlebars templates
- Complex two-way binding frameworks
- React combined with JSX
- And so on and so on...

With the introduction of [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) in ES2015, we can finally express HTML directly in Javascript without an offline compilation process.

&#x1f60c;

Straylight is a small (about 4kb, minified and gzipped), self-contained library that solves the HTML update problem by providing:

- **A Javascript template tag** for rendering HTML fragments
- **An update engine** for applying a series of template results to the HTML document over time

Let's get started!

## Installing

Install with NPM:

```sh
npm install straylight
```

and import:

```js
import { html, applyTemplate } from 'straylight';
```

Or download from a CDN:

```html
<script src='https://unpkg.com/straylight/dist/straylight.min.js'></script>
```

## Examples

The easiest way to demonstrate Straylight is by looking at some examples.

### 1. Hello World

First, you might want to review the concept of [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). A template literal tag is a function that is called with the provided template and template values.

Straylight's `html` function is a template literal tag. You can create a *template result* with the `html` tag and then apply that template result to the document using the  `applyTemplate` function:

```html
<div id='mount'></div>
<script src='https://unpkg.com/straylight/dist/straylight.min.js'></script>
<script>

window.onload = () => {
  const { html, applyTemplate } = Straylight;
  const world = 'Earth';

  applyTemplate('#mount', html`
    <h1>Hello ${world}</h1>
    <p>How are you?</p>
  `);
};

</script>
```

### 2. Simple Clock

When you apply the same template to a particular HTML container, the HTML tree is updated, rather than recreated.

In the example below, we render a clock and then update the clock every second:

```html
<div id='clock'></div>
<script src='https://unpkg.com/straylight/dist/straylight.min.js'></script>
<script>

window.onload = () => {
  const { html, applyTemplate } = Straylight;

  function renderTime() {
    return html`
      <span>${new Date().toLocaleString()}</span>
    `;
  }

  // Render the clock for the first time
  applyTemplate('#clock', renderTime());

  // Update the clock once every second
  setInterval(() => {
    applyTemplate('#clock', renderTime());
  }, 1000);
};

</script>
```

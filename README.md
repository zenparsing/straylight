# Straylight

A templating and rendering library for HTML.

## Table of Contents

- [About](#about)
- [Installing](#installing)
- [Guide](#guide)
- [API Reference](#api-reference)

## About

As a web developer, how can I dynamically update an HTML document in a way that is **safe**, **simple**, **readable**, and **efficient**?

&#x1f914;

Over the years, web developers have approached this problem in many different ways:

- `innerHTML`
- JQuery's manipulation methods
- Underscore templates
- Complex two-way binding frameworks
- React combined with JSX
- And so on...

With the introduction of [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), we finally have the opportunity to express HTML directly in Javascript without an offline compilation process.

&#x1f60c;

Straylight is a small (about **4kb**, minified and gzipped), self-contained library that solves the HTML update problem by providing:

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
<script type='module'>

import { html, applyTemplate } from 'https://unpkg.com/straylight/dist/straylight.js';

</script>
```

## Guide

### Hello World

First, you might want to review the concept of [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). A template literal **tag** is a function that is called with the provided template and template values.

Straylight's `html` function is a template literal tag. You can create a template result with the `html` tag and then apply that template result to the document using the  `applyTemplate` function:

```html
<div id='mount'></div>
<script type='module'>

import { html, applyTemplate } from 'https://unpkg.com/straylight/dist/straylight.js';

window.onload = () => {
  const world = 'Earth';

  applyTemplate('#mount', html`
    <h1>Hello ${world}</h1>
    <p>How are you?</p>
  `);
};

</script>
```

The `applyTemplate` function takes an HTML element or a CSS selector as the first argument and a template result as the second argument.

### A Simple Clock

When you apply the same template to a particular HTML container, the HTML tree is updated rather than recreated from scratch.

In the example below, we render a clock and then update the clock's display every second:

```html
<div id='clock'></div>
<script type='module'>

import { html, applyTemplate } from 'https://unpkg.com/straylight/dist/straylight.js';

window.onload = () => {
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

That should give you an idea of what Straylight is all about!

&#x1f680;

*From here on, we'll skip the HTML examples and just show Javascript modules.*

### Nested Templates

Templates can be nested within other templates:

```js
import { html } from 'straylight';

function app() {
  return html`
    ${header()}
    <main></main>
    ${footer()}
  `;
}

function header() {
  return html`
    <header>
      <h1>Application Title</h1>
      <nav>Lots of links</nav>
    </header>
  `;
}

function footer() {
  return html`
    <footer>
      Links and small grey text
    </footer>
  `;
}
```

By nesting templates, we can compose larger applications from smaller components.

### Lists

In addition to single values, we can supply an array:

```js
import { html } from 'straylight';

const planets = [
  'Mercury',
  'Venus',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
];

function renderPlanets() {
  return html`
    <h2>The Planets</h2>
    <p>Our solar system contains eight planets:</p>
    <ul>
      ${planets.map(name => html`<li>${name}</li>`)}
    </ul>
  `;
}
```

We can also supply an [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators):

```js
import { html } from 'straylight';

function *fruitItems() {
  yield html`<li>Apples</li>`;
  yield html`<li>Pears</li>`;
  yield html`<li>Bananas</li>`;
}

function renderFruit() {
  return html`
    <h2>Fruits</h2>
    <ul>${fruitItems()}</ul>
  `;
}
```

### Async Iterators

Straylight has built-in support for [async iterators](https://jakearchibald.com/2017/async-iterators-and-generators/). If an async iterator is supplied as a template value, then the document will be updated each time a new value is available.

Here is the clock example again, implemented with an async generator function:

```js
import { html } from 'straylight';

async function *generateTime() {
  while (true) {
    yield new Date().toLocaleString();
    await new Promise(r => setTimeout(r, 1000));
  }
}

function renderClock() {
  return html`
    <div class='clock'>
      ${generateTime()}
    </div>
  `;
}
```

### Attributes

Template values can be used to update element attributes:

```js
import { html } from 'straylight';

function renderWithClass(className) {
  return html`
    <div class=${className}>Content</div>
  `;
}
```

Template values can also be used to update only a part of an attribute value:

```js
import { html } from 'straylight';

function renderWithAddedClass(className) {
  return html`
    <div class='avatar ${className}'>Content</div>
  `;
}
```

An object can be supplied as a template value inside of a tag in order to update a collection of attributes:

```js
import { html } from 'straylight';

function renderWithAttributeCollection() {
  let values = {
    id: 'element-id',
    className: 'class-name',
  };

  return html`<div ${values} />`
}
```

### Attributes vs. Properties

If the element has a named property matching the attribute name found in the template, then it will set the property value on the DOM object. Otherwise, it will set the attribute using the `setAttribute` method of the `Element` interface.

### SVG

SVG can be included directly within html tags.

```js
import { html } from 'straylight';

function defaultAvatar() {
  return html`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285f4">
      <path d="
        M12,0C5.376,0 0,5.376 0,12C0,18.624 5.376,24 12,24C18.624,24 24,18.624
        24,12C24,5.376 18.624,0 12,0ZM12,20.64C9,20.64 6.348,19.104
        4.8,16.776C4.836,14.388 9.6,13.08 12,13.08C14.388,13.08 19.164,14.388
        19.2,16.776C17.652,19.104 15,20.64 12,20.64ZM12,3.6C13.992,3.6 15.6,5.208
        15.6,7.2C15.6,9.192 13.992,10.8 12,10.8C10.008,10.8 8.4,9.192
        8.4,7.2C8.4,5.208 10.008,3.6 12,3.6Z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  `;
}
```

### Differences From HTML

There are a couple of differences between normal HTML and the HTML you can write inside of Straylight html tags.

First, you can use self-closing tag syntax for any element to keep your code tidy:

```js
import { html } from 'straylight';

function useSelfClosing() {
  return html`
    <div id='first' />
    <div id='second' />
    <div id='third' />
  `;
}
```

Second, you *must* use self-closing tag syntax for all HTML "void" tags, like `<input>` and `<br>`:

```js
import { html } from 'straylight';

function voidTags() {
  return html`
    <!-- Good! -->
    <input type='text' />
    <br />
    <!-- BAD! -->
    <input type='text'>
  `;
}
```

Third, only the following HTML named character references are supported:

- `&lt;`
- `&gt;`
- `&amp;`
- `&quot;`

Decimal and hexidecimal character references (like `&#x1f4a1;`) are fully supported.

## API Reference

### html\`template\`

A template tag that returns **TemplateResult** objects.

```js
import { html } from 'straylight';

const result = html`<div>${'hello'}</div>`;

// Prints: ['hello']
console.log(result.values);
```

### applyTemplate(element, templateResult)

Applies a template result to an HTML container element. The `element` argument can be a DOM Element object or a CSS selector.

```js
import { html, applyTemplate } from 'straylight';

applyTemplate('#mount', html`
  <div>Hi!</div>
`);
```

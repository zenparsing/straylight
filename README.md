# Straylight

A templating and rendering library for HTML.

## About

As a web developer, how can I dynamically update an HTML document in a way that is **safe**, **simple**, **readable**, and **efficient**?

&#x1f914;

Over the years, web developers have approached this problem in many different ways:

- `innerHTML`
- JQuery's manipulation methods
- Underscore templates
- Complex two-way binding frameworks
- React combined with JSX
- And so on and so on...

With the introduction of [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) in ES2015, we finally have the opportunity to express HTML directly in Javascript without an offline compilation process.

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
<script src='https://unpkg.com/straylight/dist/straylight.min.js'></script>
```

## Examples

The easiest way to learn Straylight is by looking at some examples.

### Hello World

First, you might want to review the concept of [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). A template literal **tag** is a function that is called with the provided template and template values.

Straylight's `html` function is a template literal tag. You can create a template result with the `html` tag and then apply that template result to the document using the  `applyTemplate` function:

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

The `applyTemplate` function takes an HTML element or a CSS selector as the first argument and a template result as the second argument.

### A Simple Clock

When you apply the same template to a particular HTML container, the HTML tree is updated rather than recreated from scratch.

In the example below, we render a clock and then update the clock's display every second:

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

That should give you an idea of what Straylight is all about. Now let's take a look at what else we can do with these templates.

*From here on, we'll skip the HTML examples and just show javascript.*

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

### Attribute Collections

A collection of attribute values can be supplied as an object:

```js
import { html } from 'straylight';

function usernameInput() {
  const attributes = {
    id: 'username-input',
    type: 'text',
    name: 'username',
    autocomplete: false,
  };
  return html`<input ${attributes} />`;
}
```

### Properties

In some situations you might want to assign a value to an element **property** instead of an attribute. For instance, if you want to add a click handler directly to a `<button>` element you could assign a function to its `onclick` property.

To set a property value instead of an attribute, prefix the property name with a period:

```js
import { html } from 'straylight';

function sayHello() {
  alert('hello!');
}

function renderButton() {
  return html`
    <button type='button' .onclick=${sayHello}>Say Hello</button>
  `;
}
```

### Promises

Straylight has built-in support for [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). If a promise is supplied as a template value, then the document will be updated when the promise resolves:

```js
import { html } from 'straylight';

function renderFetchResult() {
  return html`
    <div>
      ${
        fetch('/api/books')
        .then(response => response.json())
        .then(data => {
          return data.books.map(book => html`
            <div>${book.author}</div>
            <div>${book.title}</div>
          `);
        })
      }
    </div>
  `;
}
```

### Async Iterators

Straylight also has built-in support for [async iterators](https://jakearchibald.com/2017/async-iterators-and-generators/). If an async iterator is supplied as a template value, then the document will be updated each time a new value is available.

Here is the clock example again, implemented with an async generator function:

```js
import { html } from 'straylight';

async function* generateTime() {
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

### Observables

Straylight also supports [observables](https://github.com/tc39/proposal-observable). If an observable is supplied as a template value, then the document will be updated each time the observable sends a value.

Let's take a look at the clock example again, this time implemented with an observable:

```js
import { html } from 'straylight';
import Observable from 'zen-observable';

function renderClock() {
  return html`
    <div class='clock'>
      ${
        new Observable(sink => {
          sink.next(new Date().toLocaleString());
          let interval = setInterval(() => sink.next(new Date().toLocaleString()), 1000);
          return () => clearInterval(interval);
        })
      }
    </div>
  `;
}
```

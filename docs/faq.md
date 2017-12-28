# FAQ

## How can I embed HTML strings directly into a template?

You can't. Well, you shouldn't. Straylight doesn't provide any built-in mechanism to inject HTML strings into templates, but you can pretty easily create your own:

```js
import { html } from 'straylight';

export function unsafeHTML(htmlString) {
  // TODO: Remove any potential XSS attacks from htmlString!
  let literals = [htmlString];
  literals.raw = literals;
  return html(literals);
}

html`
  ${ unsafeHTML('<div>Danger danger!</div>') }
`;
```

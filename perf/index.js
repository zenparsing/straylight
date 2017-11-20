import { Element } from '../src/Element.js';

function time(name, count, fn) {
  let start = Date.now();
  for (let i = 0; i < count; ++i) {
    fn(i);
  }
  console.log(`${name}: ${Date.now() - start}ms`);
}

time('Element creation', 100000, () => {
  new Element('test');
});

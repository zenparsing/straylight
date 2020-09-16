import { runTests } from './testing.js';

import './attribute-maps.js';
import './attribute-parts.js';
import './attributes.js';
import './child-updaters.js';
import './map-slot.js';
import './pending.js';
import './render.js';
import './stringify.js';
import './vdom.js';

runTests().catch(err => {
  queueMicrotask(() => { throw err; });
});

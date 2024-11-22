import { html, applyTemplate } from '../dist/straylight.js';

let $facets = Symbol('facets');
let $render = Symbol('applyTemplate');
let $rendering = Symbol('rendering')
let $renderQueued = Symbol('renderQueued')

let renderStack = [];

class RenderActivation {
  constructor(element) {
    this.element = element;
    this.facetIndex = 0;
  }

  useFacet(init) {
    let facet = this.element[$facets][this.facetIndex];
    let result = init(facet, this.element);
    if (facet && facet !== result) facet.dispose();
    this.element[$facets][this.facetIndex] = result;
    ++this.facetIndex;
    return result;
  }
}

export function getRenderActivation() {
  return renderStack.at(-1);
}

export function useState(initialState) {
  let facet = getRenderActivation().useFacet((facet, element) => {
    if (facet && facet.kind === 'state') {
      return facet;
    }

    let disposed = false;

    facet = {
      kind: 'state',
      value: typeof initialState === 'function'
        ? initialState()
        : initialState,
      setValue: (value) => {
        if (facet.value !== value) {
          facet.value = value;
          if (!disposed) element[$render]();
        }
      },
      dispose: () => { disposed = true; },
    };

    return facet;
  });

  return [facet.value, facet.setValue];
}

export function useParent(constructor) {
  let elem = getRenderActivation().element;
  for (elem = elem.parentNode; elem; elem = elem.parentNode) {
  if (elem instanceof constructor) {
      return elem;
    }
  }
  throw new Error('Unable to find context');
}

function depsEqual(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

export function useEffect(deps, init) {
  getRenderActivation().useFacet((facet) => {
    if (facet && facet.kind === 'effect') {
      if (depsEqual(facet.deps, deps)) {
        return facet;
      }
    }

    let cancel = false;

    facet = {
      kind: 'effect',
      deps,
      dispose: () => { cancel = true; },
    };

    queueMicrotask(() => {
      if (!cancel) facet.dispose = init();
    });

    return facet;
  });
}

export class LightElement extends HTMLElement {
  constructor() {
    super();
    this[$facets] = [];
    this[$rendering] = false;
    this[$renderQueued] = false;
  }

  connectedCallback() {
    this[$render]();
  }

  disconnectedCallback() {
    for (let facet of this[$facets]) {
      facet.dispose();
    }
  }

  attributeChangedCallback() {
    this[$render]();
  }

  [$render]() {
    if (this[$rendering]) {
      if (!this[$renderQueued]) {
        this[$renderQueued] = true;
        queueMicrotask(() => this[$render]());
      }
      return;
    }
    this[$rendering] = true;
    this[$renderQueued] = false;
    renderStack.push(new RenderActivation(this));
    let templateResult = null
    try {
      templateResult = this.render();
    } finally {
      this[$rendering] = false
      renderStack.pop();
    }
    if (templateResult) {
      applyTemplate(this.shadowRoot || this, templateResult);
    }
  }

  render() {
    return null;
  }
}

export { html, applyTemplate }

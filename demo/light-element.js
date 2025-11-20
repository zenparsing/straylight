import { html, applyTemplate } from '../dist/straylight.js';

let $facets = Symbol('facets');
let $render = Symbol('applyTemplate');
let $rendering = Symbol('rendering');
let $renderQueued = Symbol('renderQueued');
let $nullRender = Symbol('nullRender');

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

function getRenderActivation() {
  return renderStack.at(-1);
}

export function useElement() {
  return getRenderActivation().element;
}

export function useFacet(init) {
  return getRenderActivation().useFacet(init);
}

export function useState(initialState) {
  let facet = useFacet((facet, element) => {
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
        if (!disposed && facet.value !== value) {
          facet.value = value;
          queueMicrotask(() => {
            if (!disposed) {
              element[$render]();
            }
          });
        }
      },
      dispose: () => { disposed = true; },
    };

    return facet;
  });

  return [facet.value, facet.setValue];
}

export function useClosest(constructor) {
  let elem = useElement();
  for (elem = elem.parentNode; elem; elem = elem.parentNode) {
    if (elem instanceof constructor) {
      return elem;
    }
  }
  throw new Error('Unable to find matching ancestor');
}

function depsEqual(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function useEffect(deps, init) {
  useFacet((facet) => {
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

export function useMemo(deps, init) {
  useFacet((facet) => {
    if (facet && facet.kind === 'memo') {
      if (depsEqual(facet.deps, deps)) {
        return facet;
      }
    }

    return {
      kind: 'memo',
      deps,
      value: init(),
      dispose: () => {},
    };
  });

  return facet.value;
}

export class Element extends HTMLElement {
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
    let renderResult = null;
    try {
      renderResult = this.render();
    } finally {
      this[$rendering] = false;
      renderStack.pop();
    }
    if (renderResult !== $nullRender) {
      applyTemplate(this.shadowRoot ?? this, renderResult);
    }
  }

  render() {
    return $nullRender;
  }
}

export { html, applyTemplate };

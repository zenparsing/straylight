## Interfaces

### Rendering

```ts

interface RenderFunction {
  (props: object, children: Element[]): ElementSource;
}

interface Renderable {
  [symbols.render]: RenderFunction;
}

```

### Element Trees

```ts

type ElementTag =
  string |
  RenderFunction |
  Renderable;

interface ElementLike {
  [symbols.element]() : Element;
}

interface Element extends ElementLike {
  tag: ElementTag;
  props: object;
  children: Element[];
}

type ElementSource =
  ElementLike |
  Array |
  string |
  number |
  boolean |
  null |
  undefined;

interface ElementConstructor {
  new(tag: ElementTag, props?: object, children?: any[]): Element;
  from(source: ElementSource): Element;
  evaluate(source: ElementSource) : Element;
}

```

### Data Stores

```ts
interface Store extends ObservableLike<object> {
  getState(fn?: object => any): object;
  setState(data: object): void;
  setState(fn: object => object): void;
  subscribe(onNext: object => void): Subscription;
}
```

### User Interfaces

```ts

interface UIConstructor extends Renderable {
  new(): UI;
  mapPropsToState(props: object, children: Element[]): any;
}

interface UI extends Renderable, ObservableLike<ElementSource> {
  getState(fn?: object => any): object;
  setState(data: object): void;
  setState(fn: object => object): void;

  start(): void;
  pause(): void;

  render: RenderFunction;
  renderState(): Element;
}

```

## Interfaces

### Rendering

```ts

interface RenderFunction {
  (props, context): Element;
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
  evaluate(source: ElementSource, context?: any) : Element;
}

```

### Content Managers

```ts

interface ContentManager {
  [symbols.mapStateToContent](states: Observable<any>): Observable<ElementSource>;
}

```

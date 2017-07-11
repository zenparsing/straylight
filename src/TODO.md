## TODO

### Text selection

Should we attempt to maintain selection states across updates? If the user has selected some
text and those text nodes are updated, it will mess with the selection. Does React even account
for this?

https://github.com/facebook/react/blob/b1768b5a48d1f82e4ef4150e0036c5f846d3758a/src/renderers/dom/shared/ReactInputSelection.js

https://github.com/facebook/react/blob/5ad1c76386142fbb4e573ca41cc7fad004de8b95/src/renderers/dom/shared/ReactDOMSelection.js

### Input values

Setting some attribute values will not update the corresponding UI features (e.g. "value" in
INPUT elements). Unfortunately, setting these values also tends to break user expectations
that input elements should maintain their own state if the user is currently interacting
with them. But not setting them breaks another set of user expectations. See "input", "option",
and "textarea".

https://github.com/patrick-steele-idem/morphdom/blob/master/src/specialElHandlers.js

### Style objects

Should we accept style objects and convert those values to style strings?

https://github.com/facebook/react/blob/e6f1d29f072b2be2e9795ffc781a965cb69f0347/src/renderers/dom/shared/CSSPropertyOperations.js

### Naming: UI.prototype.update

We currently have an update method for both Store and UI, meaning very different things.
Ideally these would be different names.

### Nested UI instances

- Do we need to somehow share context between the parent and child UI instances?
- Does it make sense to push props into the nested UI store? For the current implementation
  we're not getting the right props anyway: we're updating with the props of the target
  node instead of the UI render function.

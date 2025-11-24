let map = new Map();

let registry = new FinalizationRegistry((key) => {
  map.delete(key);
});

export function add(key, elem) {
  map.set(key, new WeakRef(elem));
  registry.register(elem);
}

export function get(key, tag) {
  let elem = map.get(key)?.deref();
  if (elem && elem.nodeName === tag && !elem.isConnected) {
    return elem;
  }
  return null;
}

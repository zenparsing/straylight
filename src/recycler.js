let map = new Map();

export function add(key, elem) {
  map.set(key, new WeakRef(elem));
}

export function get(key, tag) {
  let elem = map.get(key)?.deref();
  if (elem && elem.nodeName === tag && !elem.isConnected) {
    return elem;
  }
  return null;
}

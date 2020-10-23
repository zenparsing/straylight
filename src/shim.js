// IE11 does not support argument to Map constructor
const supportsMapArg = (new Map([[1, 1]]).size > 0);

export function convertToMap(pairs) {
  if (pairs instanceof Map) {
    return pairs;
  }
  if (!supportsMapArg) {
    let map = new Map();
    pairs.forEach(pair => map.set(pair[0], pair[1]));
    return map;
  }
  return new Map(pairs);
}

const Sym = typeof Symbol === 'function' ? Symbol : (name => `@@${name}`);

export { Sym as Symbol };

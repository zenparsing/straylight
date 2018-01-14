/* istanbul ignore file */

// IE11 does not support argument to Map constructor
const supportsMapArg = (new Map([[1, 1]]).size > 0);

export function createMapFrom(pairs) {
  if (supportsMapArg) {
    return new Map(pairs);
  } else {
    // IE11
    let map = new Map();
    pairs.forEach(pair => map.set(pair[0], pair[1]));
    return map;
  }
}

const Sym = typeof Symbol === 'function' ? Symbol : (name => `@@${name}`);

export { Sym as Symbol };

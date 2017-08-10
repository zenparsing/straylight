function cssEscape(value) {
  let string = String(value);
  let { length } = string;
  let first = string.charCodeAt(0);
  let result = '';

  for (let index = 0; index < length; ++index) {
    let code = string.charCodeAt(index);
    let next;

    if (
      code === 0x0000
    ) {
      next = '\uFFFD';
    } else if (
      code >= 0x0001 && code <= 0x001F ||
      code === 0x007F ||
      index === 0 && code >= 0x0030 && code <= 0x0039 ||
      index === 1 && code >= 0x0030 && code <= 0x0039 && first === 0x002D
    ) {
      next = `\\${code.toString(16)}`;
    } else if (
      index === 0 && length === 1 && code === 0x002D
    ) {
      next = `\\${string.charAt(index)}`;
    } else if (
      code >= 0x0080 ||
      code === 0x002D ||
      code === 0x005F ||
      code >= 0x0030 && code <= 0x0039 ||
      code >= 0x0041 && code <= 0x005A ||
      code >= 0x0061 && code <= 0x007A
    ) {
      next = string.charAt(index);
    } else {
      next = `\\${string.charAt(index)}`;
    }

    result += next;
  }

  return result;
}

export function css(literals, ...values) {
  let result = '';
  for (let i = 0; i < literals.length; i++) {
    result += literals[i];
    if (i < values.length) {
      result += cssEscape(values[i]);
    }
  }
  return result;
}

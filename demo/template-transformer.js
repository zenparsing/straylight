let H = {
  root: children => ({
    kind: 'root',
    tag: '',
    attributes: [],
    children
  }),

  elem: (tag, attributes, children) => ({
    kind: 'element',
    tag,
    attributes,
    children
  }),

  node: (kind) => ({
    kind,
    tag: '',
    attributes: [],
    children: []
  }),

  attr: (name, value, kind = 'static') => ({
    kind,
    name,
    value
  })
};

function indent(depth) {
  return ' '.repeat(depth * 2);
}

function writeNodes(nodes, depth) {
  if (nodes.length == 0) {
    return '[]';
  }
  return '[\n' + nodes.map(node => {
    return `${indent(depth)}${writeNode(node, depth)}`;
  }).join(',\n') + ']';
}

function writeNode(node, depth = 0) {
  if (typeof node === 'string') {
    return JSON.stringify(node);
  }
  switch (node.kind) {
    case 'element': {
      return `H.elem(${JSON.stringify(node.tag)}, ` +
        `${writeAttrs(node.attributes, depth + 1)}, ` +
        `${writeNodes(node.children, depth + 1)})`;
    }
    case 'root': {
      return `H.root(${writeNodes(node.children, depth + 1)})`;
    }
    default: {
      return `H.node(${JSON.stringify(node.kind)})`;
    }
  }
}

function writeAttrs(attrs, depth) {
  if (attrs.length == 0) {
    return '[]';
  }
  return '[\n' + attrs.map(attr => {
    return `${indent(depth)}${writeAttr(attr, depth)}`;
  }).join(',\n') + ']';
}

function writeAttr(attr, out, depth) {
  let str = `H.attr(${JSON.stringify(attr.name)}, ${JSON.stringify(attr.value)}`;
  if (attr.kind !== 'static') {
    str += `, ${JSON.stringify(attr.kind)}`;
  }
  str += ')';
  return str;
}

export { writeNode, H };

var extras = require('htmltag/extras');
exports.stringify = function(template) {
  return template.evaluate(extras.stringBuilder);
};

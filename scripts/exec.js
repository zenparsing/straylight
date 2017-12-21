const { execSync } = require('child_process');

module.exports = function(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env });
  } catch (err) {
    process.exit(1);
  }
};

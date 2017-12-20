const { execSync } = require('child_process');

module.exports = cmd => execSync(cmd, { stdio: 'inherit', env: process.env });

import { execSync } from 'child_process';

export function $(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env });
  } catch (err) {
    if (!opts.ignoreErrors) {
      process.exit(1);
    }
  }
}

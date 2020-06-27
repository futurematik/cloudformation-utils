const path = require('path');
const proc = require('child_process');

const cmd = path.resolve(__dirname, 'node_modules/.bin/tsc');

const args = [
  '-p',
  path.resolve(process.cwd(), 'tsconfig.json'),
  '-w',
  '--preserveWatchOutput',
  '--incremental',
];

const response = proc.spawnSync(cmd, args, {
  cwd: __dirname,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (response.error) {
  throw response.error;
}

process.exit(response.status);

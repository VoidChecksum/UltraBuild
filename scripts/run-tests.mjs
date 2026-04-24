import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collect(file));
    else if (entry.name.endsWith('.test.js')) files.push(file);
  }
  return files;
}

const files = await collect('dist/test');
if (!files.length) {
  console.error('No compiled test files found in dist/test');
  process.exit(1);
}
const child = spawn(process.execPath, ['--test', ...files], { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

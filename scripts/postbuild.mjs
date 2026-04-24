import { chmod, writeFile } from 'node:fs/promises';

await writeFile('dist/cli.js', '#!/usr/bin/env node\nimport "./src/cli.js";\n', 'utf8');
await chmod('dist/cli.js', 0o755);

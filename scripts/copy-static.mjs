import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'dist/renderer'), { recursive: true });
mkdirSync(join(root, 'dist/assets'), { recursive: true });
for (const f of ['index.html', 'styles.css', 'app.js']) {
  cpSync(join(root, 'src/renderer', f), join(root, 'dist/renderer', f));
}
if (existsSync(join(root, 'assets'))) {
  cpSync(join(root, 'assets'), join(root, 'dist/assets'), { recursive: true });
}
console.log('static copied');

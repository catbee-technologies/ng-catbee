import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const dtsFile = join(ROOT, 'dist', '@ng-catbee', 'monaco-editor', 'types', 'ng-catbee-monaco-editor.d.ts');
const refLine = '/// <reference types="../monaco.d.ts" />\n';

if (existsSync(dtsFile)) {
  const content = readFileSync(dtsFile, 'utf8');

  if (!content.startsWith(refLine)) {
    writeFileSync(dtsFile, refLine + content, 'utf8');
    console.log('✅ Added monaco reference to .d.ts');
  } else {
    console.log('ℹ Reference already present — no change.');
  }

} else {
  console.error('❌ .d.ts not found at:', dtsFile);
}

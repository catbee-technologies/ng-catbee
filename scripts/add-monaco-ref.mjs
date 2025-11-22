import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const dtsFile = join('dist', '@ng-catbee', 'monaco-editor', 'types', 'ng-catbee-monaco-editor.d.ts');
const refLine = '/// <reference types="../monaco.d.ts" />\n';

if (existsSync(dtsFile)) {
  const content = readFileSync(dtsFile, 'utf8');
  if (!content.startsWith(refLine)) {
    writeFileSync(dtsFile, refLine + content, 'utf8');
    console.log('✅ Added monaco reference line to index.d.ts');
  } else {
    console.log('ℹ️ monaco reference already present.');
  }
} else {
  console.error('❌ index.d.ts not found at', dtsFile);
}

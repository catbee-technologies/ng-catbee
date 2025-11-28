import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Path to LICENSE file
const licensePath = path.join(ROOT, 'LICENSE');

// Directories/files to include
const includePaths = [
  path.join(ROOT, 'dist'),
];

const excludePaths = [
  path.join(ROOT, 'dist/test-out'),
];

// Extensions to include
const includeExtensions = ['.js', '.ts', '.d.ts', '.mjs', '.cjs'];

// Filenames or paths to skip
const excludePatterns = [
  '.map',           // skip source maps
  'monaco.d.ts',    // skip specific file
];

// Read and format LICENSE file
const licenseText = fs.readFileSync(licensePath, 'utf-8');
const formattedLicense = [
  '/*',
  ...licenseText.split('\n').map(line => ` * ${line}`),
  ' */',
  ''
].join('\n');

// Recursively get all files under a directory
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// Check if file should be skipped
function isExcluded(file) {
  return excludePatterns.some(pattern => file.endsWith(pattern)) ||
    excludePaths.some(excludePath => file.startsWith(excludePath));
}

// Process files
for (const basePath of includePaths) {
  const files = getFiles(basePath).filter(file =>
    includeExtensions.some(ext => file.endsWith(ext)) && !isExcluded(file)
  );

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Skip if license is already present
    if (content.startsWith('/*\n * The MIT License')) {
      console.log(`✔ LICENSE already present in ${filePath} - skipping.`);
      continue;
    }
    fs.writeFileSync(filePath, formattedLicense + '\n' + content, 'utf-8');
    console.log(`✔ LICENSE attached to ${filePath}`);
  }
}

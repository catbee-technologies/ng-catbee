import fs from 'fs';
import istanbulLibCoverage from 'istanbul-lib-coverage';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../');
const coverageDir = path.join(root, 'coverage');
const files = [];

function scan(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) scan(full);
    else if (file === 'coverage-final.json') files.push(full);
  }
}

scan(coverageDir);

const map = istanbulLibCoverage.createCoverageMap({});

for (const file of files) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  map.merge(json);
}

fs.writeFileSync(`${coverageDir}/coverage-merged.json`, JSON.stringify(map, null, 2));

console.log('✔ Coverage merged:', files.length, 'files');

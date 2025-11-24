import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const licensePath = path.join(ROOT, 'LICENSE');

console.log(`\nAttaching LICENSE to built files...\n`);

const licenseBanner =
  '/*\n' +
  fs.readFileSync(licensePath,'utf8').split('\n').map(l=>` * ${l}`).join('\n') +
  '\n */\n\n';

// Recursively list files
function getFiles(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>{
    const full = path.join(dir,f.name);
    return f.isDirectory() ? getFiles(full) : full;
  });
}

const distDir = path.join(ROOT,'dist');
if(!fs.existsSync(distDir)){
  console.log('❌ dist folder not found. Build first.');
  process.exit(0);
}

const files = getFiles(distDir).filter(f=>
  !f.endsWith('.map') &&
  !f.includes('test-out') &&
  !f.includes('monaco.d.ts') &&
  /\.(js|mjs|cjs|ts|d\.ts)$/i.test(f)
);

console.log(`Found ${files.length} files\n`);

files.forEach(file=>{
  const content = fs.readFileSync(file,'utf8');

  if(content.includes('The MIT License')){
    return;
  }

  fs.writeFileSync(file,licenseBanner + content,'utf8');
});

console.log('LICENSE Added.\n');

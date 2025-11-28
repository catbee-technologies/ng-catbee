#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import process from 'process';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage: node npm-release.mjs <package> <version|patch|minor|major|prepatch|preminor|premajor|prerelease> [preid] [dry-run]');
  process.exit(1);
}

const [pkgName, bump] = args;
const preid = args[2]?.startsWith('--') ? undefined : args[2]; // optional preid
const dryRunMode = args.includes('dry-run'); // if --dry-run is present
const validPackages = ['utils', 'monaco-editor'];

if (dryRunMode) {
  console.log('⚠️  Dry-run mode activated. No changes will be made.');
}

if (!validPackages.includes(pkgName)) {
  console.error(`❌ Invalid package "${pkgName}". Allowed packages: ${validPackages.join(', ')}`);
  process.exit(1);
}

const projectPath = path.resolve(`packages/${pkgName}`);
const pkgJsonPath = path.join(projectPath, 'package.json');

if (!fs.existsSync(pkgJsonPath)) {
  console.error(`❌ package.json not found at ${pkgJsonPath}`);
  process.exit(1);
}

// Ensure clean working directory
const status = execSync('git status --porcelain', { encoding: 'utf8' });
if (!dryRunMode && status) {
  console.warn('⚠️  Uncommitted changes detected. Commit or stash them before releasing.');
  process.exit(1);
}

const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const currentVersion = pkgJson.version;

const allowedBumps = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease'
];

let newVersion;

if (allowedBumps.includes(bump)) {
  let cmd = `npm version ${bump} --prefix ${projectPath} --no-git-tag-version`;

  const needsPreid = bump.startsWith('pre');
  const validPreIds = ['alpha', 'beta', 'rc', 'next', 'dev', 'nightly', 'canary', 'test', 'snapshot'];
  if (needsPreid && !preid) {
    console.error(`❌ Missing preid for ${bump}. Expected: ${validPreIds.join(', ')}`);
    process.exit(1);
  }

  if (needsPreid) {
    if (!validPreIds.includes(preid)) {
      console.error(`❌ Invalid preid "${preid}". Allowed preids: ${validPreIds.join(', ')}`);
      process.exit(1);
    }
    cmd += ` --preid=${preid}`;
  }

  if (dryRunMode) {
    newVersion = execSync(cmd + ' --json', { encoding: 'utf8' });
    console.log(`✔ [DRY-RUN] ${pkgName} would be bumped from ${currentVersion} ➡️ ${newVersion}`);
    execSync(`git checkout -- ${pkgJsonPath}`);
    process.exit(0);
  } else {
    newVersion = execSync(cmd, { encoding: 'utf8' }).trim().replace('v', '');
  }
} else {
  // Explicit version
  newVersion = bump;
  if (!dryRunMode) {
    pkgJson.version = newVersion;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  } else {
    console.log(`✔ [DRY-RUN] ${pkgName} would be set from ${currentVersion} ➡️ ${newVersion}`);
    process.exit(0);
  }
}

console.log(`🎉 Successfully bumped ${pkgName} from ${currentVersion} ➡️ ${newVersion}`);

if (!dryRunMode) {
  console.log('💾 Committing changes...');
  execSync(`git add ${pkgJsonPath}`, { stdio: 'inherit' });
  execSync(`git commit -m "release(${pkgName}): v${newVersion}"`, { stdio: 'inherit' });

  const tagName = `${pkgName}@v${newVersion}`;
  console.log(`🏷️ Creating git tag "${tagName}"`);
  execSync(`git tag ${tagName}`, { stdio: 'inherit' });

  console.log('📤 Pushing changes and tags...');
  execSync('git push', { stdio: 'inherit' });
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

  console.log(`🏷️ Tag released: ${pkgName} v${newVersion}`);
}

/** Cleanup local tags */
// git tag | ForEach-Object { git tag -d $_ }

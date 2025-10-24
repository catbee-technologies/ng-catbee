#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import process from 'process';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node release.mjs <package> <version|patch|minor|major|prepatch|preminor|premajor|prerelease> [preid]');
  process.exit(1);
}

const [pkgName, bump] = args;
const preid = args[2]; // optional preid (alpha, beta, rc, next)
const validPackages = ['utils', 'monaco-editor'];

if (!validPackages.includes(pkgName)) {
  console.error(`Invalid package. Allowed: ${validPackages.join(', ')}`);
  process.exit(1);
}

const projectPath = path.resolve(`packages/${pkgName}`);
const pkgJsonPath = path.join(projectPath, 'package.json');

if (!fs.existsSync(pkgJsonPath)) {
  console.error(`package.json not found at ${pkgJsonPath}`);
  process.exit(1);
}

// Ensure clean working directory
const status = execSync('git status --porcelain', { encoding: 'utf8' });
if (status) {
  console.warn('⚠️  You have uncommitted changes. Commit or stash them before releasing.');
  process.exit(1);
}

const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

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

  // prerelease types require a preid
  const needsPreid = bump.startsWith('pre');
  if (needsPreid && !preid) {
    console.error(`⚠️  Missing preid for ${bump} (expected something like "alpha", "beta", "rc", "next")`);
    process.exit(1);
  }

  if (needsPreid) {
    cmd += ` --preid=${preid}`;
  }

  newVersion = execSync(cmd, { encoding: 'utf8' }).trim();
} else {
  // explicit version
  newVersion = bump;
  pkgJson.version = newVersion;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
}

execSync(`git add ${pkgJsonPath}`, { stdio: 'inherit' });
execSync(`git commit -m "release(${pkgName}): ${newVersion}"`, { stdio: 'inherit' });

const tagName = `${pkgName}@v${newVersion}`;
execSync(`git tag ${tagName}`, { stdio: 'inherit' });
execSync('git push', { stdio: 'inherit' });
execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

console.log(`✅ Released ${pkgName} v${newVersion}`);

/*
  Usage Examples:

  🔹 Standard bumps:
    npm run release:utils patch
    npm run release:monaco minor
    npm run release:utils major

  🔹 Explicit version:
    npm run release:utils 1.2.5
    npm run release:monaco 2.0.0

  🔹 Prerelease bumps:
    npm run release:utils prepatch alpha
    npm run release:monaco preminor beta
    npm run release:utils premajor rc
    npm run release:monaco prerelease next
*/

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

const validPackages = ['utils', 'monaco-editor', 'cookie', 'jwt', 'loader', 'storage', 'indexed-db'];

let pkgList = args.filter(a => validPackages.includes(a));     // all valid packages in CLI
const bump = args.find(a => !validPackages.includes(a));       // first non-package argument = bump type
const preid = args.find(a => ['alpha', 'beta', 'rc', 'next', 'dev', 'nightly', 'canary', 'test', 'snapshot'].includes(a));
const dryRunMode = args.includes('dry-run') || args.includes('dryrun');

if (!pkgList.length) {
  console.error("❌ No valid packages provided!");
  process.exit(1);
}

console.log("Args:", args.join(' '));

console.log("📦 Packages to release:", pkgList.join(', '));
if (dryRunMode) console.log("⚠️  Dry Run Mode — no changes will be applied");

if (!dryRunMode) {
  let seconds = 5;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  let i = 0;
  let ms = seconds * 1000;

  const intervalId = setInterval(() => {
    const secs = Math.ceil(ms / 1000); // derived from remaining ms
    process.stdout.write(`\r🚀 ${frames[i++ % frames.length]}  Releasing in ${secs}s  `);
    ms -= 100;

    if (ms <= 0) {
      clearInterval(intervalId);
      process.stdout.write("\r🚀 Starting release...        \n");
    }
  }, 100);

  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const allowedBumps = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];

if (!allowedBumps.includes(bump) && !/^\d+\.\d+\.\d+(-.*)?$/.test(bump)) {
  console.error(`❌ Invalid bump "${bump}". Expected version or one of: ${allowedBumps.join(', ')}`);
  process.exit(1);
}

// Ensure clean working directory
const status = execSync('git status --porcelain', { encoding: 'utf8' });
if (!dryRunMode && status) {
  console.warn('⚠️  Uncommitted changes detected. Commit or stash them before releasing.');
  process.exit(1);
}

let generatedTags = [];

for (const pkgName of pkgList) {
  const projectPath = path.resolve(`packages/${pkgName}`);
  const pkgJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    console.error(`❌ Missing package.json for ${pkgName}`);
    process.exit(1);
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const currentVersion = pkgJson.version;
  let newVersion = bump;

  let cmd = `npm version ${bump} --prefix ${projectPath} --no-git-tag-version`;

  if (allowedBumps.includes(bump)) {
    // Handle prerelease with identifier
    if (bump.startsWith("pre") && !preid) {
      console.error(`❌ Pre-release requires preid (alpha/beta/rc...)`);
      process.exit(1);
    }
    if (preid) cmd += ` --preid=${preid}`;
    if (dryRunMode) {
      newVersion = execSync(cmd + ' --json', { encoding: 'utf8' });
      console.log(`✔ [DRY-RUN] ${pkgName} would be bumped from ${currentVersion} ➡️   ${newVersion}`);
      execSync(`git checkout -- ${pkgJsonPath}`);
    }
    if (!dryRunMode) newVersion = execSync(cmd, { encoding: "utf8" }).trim().replace('v', '');
  } else if (!dryRunMode) {
    pkgJson.version = bump;
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  }

  if (!dryRunMode) {
    console.log(`✔ ${pkgName} bumped from ${currentVersion} ➡️   ${newVersion}`);
    execSync(`git add ${pkgJsonPath}`);
    execSync(`git commit -m "release(${pkgName}): v${newVersion}"`);
    const tag = `${pkgName}@v${newVersion}`;
    execSync(`git tag ${tag}`);
    generatedTags.push(tag);
  }
}

if (!dryRunMode) {
  console.log("\n📤 Pushing commits + tags...");
  execSync("git push", { stdio: "inherit" });
  execSync(`git push origin ${generatedTags.join(" ")}`, { stdio: "inherit" });
  console.log("🏁 Release complete →", generatedTags.join(", "));
}

/** Cleanup local tags */
// git tag | ForEach-Object { git tag -d $_ }

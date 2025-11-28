import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const packagesDir = path.join(root, "packages");

console.log("\nRunning build for each package...\n");

const packages = fs.readdirSync(packagesDir);

let count = 0;
const pkgs = [];
for (const pkg of packages) {
  const pkgPath = path.join(packagesDir, pkg);
  if (!fs.statSync(pkgPath).isDirectory()) continue;
  console.log(`📦 Building → ${pkg}`);
  try {
    execSync("npm run build", { cwd: pkgPath, stdio: "inherit" });
    console.log(`\n✔ Completed build for ${pkg}\n`);
    pkgs.push(pkg);
    count++;
  } catch (err) {
    console.error(`\n✖ Build failed for package: ${pkg}`);
    console.error(err.message);
    process.exit(1);
  }
}

console.log(`✔ All packages(${count}) built successfully! - ${pkgs.join(', ')}\n`);
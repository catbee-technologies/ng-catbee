import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folders allowed to remain in the package dist folders
const allowedFolders = ["fesm2022", "types", "styles", "css"];

async function run() {
  const root = path.resolve(__dirname, "..");
  const packagesDir = path.join(root, "packages");
  const distBase = path.join(root, "dist/@ng-catbee");

  const licensePath = path.join(root, "LICENSE");
  if (!fs.existsSync(licensePath)) {
    console.error("❌ LICENSE missing at root!");
    process.exit(1);
  }

  const items = await fs.readdir(packagesDir);

  for (const name of items) {
    const pkgDir = path.join(packagesDir, name);

    // PROCESS ONLY FOLDERS
    const stat = await fs.stat(pkgDir).catch(() => null);
    if (!stat || !stat.isDirectory()) continue;

    const distTarget = path.join(distBase, name);
    await fs.ensureDir(distTarget);

    // Copy LICENSE
    await fs.copy(licensePath, path.join(distTarget, "LICENSE"));
    console.log(`✔ Copied LICENSE → @ng-catbee/${name}`);

    // Copy README if exists
    const readmePath = path.join(pkgDir, "README.md");
    if (fs.existsSync(readmePath)) {
      await fs.copy(readmePath, path.join(distTarget, "README.md"));
      console.log(`✔ Copied README.md → @ng-catbee/${name}`);
    }

    // Cleanup dist folder: remove unwanted files/folders
    const distItems = await fs.readdir(distTarget);
    for (const item of distItems) {
      const full = path.join(distTarget, item);
      const isDir = (await fs.stat(full)).isDirectory();
      if (isDir && !allowedFolders.includes(item)) {
        await fs.remove(full);
      }
    }
  }

  console.log("✔ Postbuild cleanup completed!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

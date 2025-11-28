import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

/* Utility functions for preparing builds */

// Get important paths
export function getPaths(metaUrl) {
    const __dirname = path.dirname(fileURLToPath(metaUrl || import.meta.url));
    const __root = path.resolve(path.dirname(fileURLToPath(metaUrl || import.meta.url)), '../');
    const __workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../');
    const INPUT_PATH = path.resolve(__root + '/src');
    const PACKAGE_NAME = path.basename(path.resolve(__root));
    const OUTPUT_PATH = path.resolve(__workspace + '/dist/@ng-catbee/' + PACKAGE_NAME);
    const paths = { __dirname, __root, __workspace, INPUT_PATH, OUTPUT_PATH, PACKAGE_NAME };
    return paths;
}

// Clean build folders
export function cleanBuild(metaUrl) {
    const { __workspace, OUTPUT_PATH } = getPaths(metaUrl);
    fs.remove(OUTPUT_PATH);
    fs.remove(path.resolve(__workspace, '.angular'));
}

// Prepare package.json for build output
export function preparePackageJson(localPackageJson, INPUT_PATH) {
    const pkgPath = path.join(INPUT_PATH, 'package.json');
    fs.copyFileSync(localPackageJson, pkgPath);
    cleanPackageJson(pkgPath);
}

// Clean package.json by removing unnecessary fields
export function cleanPackageJson(localPackageJson, callback) {
    const pkg = JSON.parse(fs.readFileSync(localPackageJson, { encoding: 'utf8', flag: 'r' }));

    delete pkg?.scripts;
    delete pkg?.devDependencies;

    fs.writeFileSync(localPackageJson, JSON.stringify(pkg, null, 2) + '\n', { encoding: 'utf8' });
}

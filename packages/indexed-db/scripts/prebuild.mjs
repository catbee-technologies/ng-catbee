import path from 'path';
import { preparePackageJson, cleanBuild, getPaths } from '../../../scripts/prepare-build.mjs';

cleanBuild(import.meta.url);

const { INPUT_PATH } = getPaths(import.meta.url);
const localPackageJson = path.resolve(getPaths(import.meta.url).__dirname, '../package.json');

preparePackageJson(localPackageJson, INPUT_PATH);
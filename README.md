# @ng-catbee

## Angular WorkSpace for Libraries by Catbee
A collection of Angular libraries developed and maintained by the Catbee team.

## Packages
- `@ng-catbee/monaco-editor`: Angular components and services for integrating the Monaco Editor into Angular applications.

## Project Structure
- `packages/`: Contains individual Angular libraries.
- `dist/`: Compiled output of the libraries.
- `coverage/`: Code coverage reports.
- `scripts/`: Build and utility scripts.
- `angular.json`: Angular workspace configuration file.
- `eslint.config.mjs`: ESLint configuration for the workspace.
- `karma.config.mjs`: Karma test runner configuration.
- `codecov.yml`: Code coverage configuration.
- `.prettierrc`: Prettier code formatting configuration.
- `LICENSE`: License information for the project.
- `renovate.json`: Renovate bot configuration for dependency updates.

## Getting Started
To get started with any of the libraries, navigate to the respective package directory in `packages/` and follow the README instructions provided there.

## Creating a New Library
To create a new Angular library within this workspace, use the Angular CLI command:
```bash
ng generate library <library-name>
```

## Building
To build all libraries in the workspace, use the following command:
```bash
npm run build
```
To build a specific library, navigate to its directory and run:
```bash
npm run build <library-name>
```

## Linting
To lint the codebase, use the following command:
```bash
npm run lint
```
To automatically fix linting issues, use:
```bash
npm run lint:fix
```

## Formatting

To format the codebase using Prettier, use the following command:
```bash
npm run format
```

## Testing
To run tests for all libraries, use the following command:
```bash
ng test
```
To run tests for a specific library, navigate to its directory and run:
```bash
ng test <library-name>
```
To run tests with headless Chrome, use:
```bash
ng test --no-progress --code-coverage --no-watch --browsers=ChromeHeadless
```
or
```bash
npm run test
```

## Release
To release a new version of a library, use the following command:
```bash
npm run release:<library-name> patch|minor|major
```
or
```bash
npm run release:<library-name> <version>
```

## PreReleases
To create a prerelease version of a library, use the following command:
```bash
npm run release:<library-name> prepatch|preminor|premajor|prerelease <prerelease-identifier>
```

### Examples
```bash
 # Standard bumps:
   npm run release:utils patch
   npm run release:monaco minor
   npm run release:utils major

 # Explicit version:
   npm run release:utils 1.2.5
   npm run release:monaco 2.0.0

 # Prerelease bumps:
   npm run release:utils prepatch alpha
   npm run release:monaco preminor beta
   npm run release:utils premajor rc
   npm run release:monaco prerelease next
```


## License
This project is licensed under the MIT License. See the LICENSE file for details.

/**
 * Commit Message Examples:
 *
 * These examples demonstrate the **conventional commit format** that this configuration enforces.
 *
 * Format:
 *   <type>(<scope>): <subject>
 *
 * Where:
 *   - `type`      : the category of the commit (e.g., feat, fix, chore)
 *   - `scope`     : optional; specifies the area of the codebase affected (e.g., user, auth, api)
 *   - `subject`   : a short description of the change in lowercase, imperative mood
 *
 * Examples:
 *   -> feat(user): add something
 *      - 'feat'       : indicates a new feature
 *      - '(user)'     : the scope, here the 'user' module is affected
 *      - 'add something' : a concise description of the change
 *
 *   -> feat: add something
 *      - 'feat'       : indicates a new feature
 *      - no scope     : scope is optional
 *      - 'add something' : a concise description of the change
 *
 * Notes:
 *   - Always use lowercase for `type` and `scope`.
 *   - Use imperative mood for `subject` ("add", "fix", "update") rather than past tense.
 *   - Scope is optional but recommended for larger projects to group changes.
 *   - These examples help contributors understand how to write commit messages
 *     that conform to the rules defined in this Commitlint configuration.
 */

export default {
  $schema: "https://json.schemastore.org/commitlintrc.json",
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',        // new feature
        'fix',         // bug fix
        'hotfix',      // urgent fix in production
        'improvement', // small enhancement
        'refactor',    // code refactor (no feature/fix)
        'perf',        // performance improvements
        'style',       // code style (formatting, missing semi, etc.)
        'docs',        // documentation
        'test',        // adding/modifying tests
        'chore',       // maintenance tasks
        'deps',        // dependency updates
        'build',       // build system/config
        'ci',          // CI/CD changes
        'config',      // config files (eslint, prettier, commitlint)
        'release',     // release-related commits
        'workflow',    // tooling/workflow changes
        'merge',       // branch merges
        'revert'       // reverting commits
      ]
    ],
    'scope-empty': [0, 'always'],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0, 'always'],
  }
};

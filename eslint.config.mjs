import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import eslint from '@eslint/js';

export default tseslint.config(
  {
    files: ["**/*.ts"],
    ignores: ["**/*.spec.ts", "packages/monaco-editor/monaco.d.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "ng-catbee",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "ng-catbee",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/no-inferrable-types": "off",
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@angular-eslint/prefer-standalone": "warn",
      "@typescript-eslint/no-empty-function": "error",
      "@angular-eslint/no-output-native": "error"
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);

const globals = require("globals");
const js = require("@eslint/js");
const prettier = require("eslint-plugin-prettier");

module.exports = [
  {
    files: ['**/*.js', '**/*.js'],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
          ...globals.browser,
          ...globals.node,
          myCustomGlobal: "readonly"
      }
    },
    plugins: {
      prettier: prettier
    },
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.js'],
    rules: {
      'linebreak-style': 0,
      'max-len': ['error', {'code': 120}],
      ...prettier.configs.recommended.rules
    },
  },
  {
    ignores: ['node-modules/*'],
  },
];
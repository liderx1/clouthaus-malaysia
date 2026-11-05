// Lints the 3D map (src/map), the shared logic it is tested through (src/map/core) and the build scripts.
// The Next.js / Payload TypeScript is checked by `tsc` in the build.
import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['src/map/vendor/**', 'public/**', '.next/**', 'node_modules/**', 'src/migrations/**', 'src/app/**', 'seed/**'] },
  js.configs.recommended,
  {
    files: ['src/map/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-import-assign': 'error',
      'no-shadow-restricted-names': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
  // browser tests: callbacks passed to page.evaluate run in the page
  { files: ['tests/e2e/**/*.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
]

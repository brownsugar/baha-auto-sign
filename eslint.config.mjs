import brownsugarConfig from '@brownsugar/eslint-config/typescript'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'build/**'],
  },
  ...brownsugarConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        chrome: 'readonly',
      },
    },
    rules: {
      camelcase: 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]

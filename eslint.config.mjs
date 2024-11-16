import brownsugarConfig from '@brownsugar/eslint-config/typescript'

export default [
  ...brownsugarConfig,
  {
    rules: {
      camelcase: 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]

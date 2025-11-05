module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@/components/Modal',
            message: 'Importa Modal desde "@/components/ui" para mantener consistencia.',
          },
          {
            name: '@/components/Button',
            message: 'Importa Button desde "@/components/ui" para mantener consistencia.',
          },
        ],
      },
    ],
  },
}


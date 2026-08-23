module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'react-hooks', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Asset `require()` calls are idiomatic in Expo/React Native.
    '@typescript-eslint/no-var-requires': 'off',
    // Allow intentionally-unused params prefixed with underscore.
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    {
      // Node/CommonJS config files
      files: [
        'metro.config.js',
        'babel.config.js',
        '.eslintrc.js',
        'netlify/**',
      ],
      env: {
        node: true,
        commonjs: true,
      },
    },
    {
      // Test files (jest globals)
      files: [
        '*.test.js',
        '*.test.ts',
        '*.spec.js',
        '*.spec.ts',
        '**/__tests__/**',
        'tests/**',
      ],
      env: {
        jest: true,
        node: true,
      },
    },
  ],
};

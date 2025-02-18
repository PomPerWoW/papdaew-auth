const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');
const eslintPluginPrettier = require('eslint-plugin-prettier');
const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    files: ['**/*.js'],
    ignores: ['**/node_modules/**', 'coverage/**', 'dist/**', '.husky/**'],
    plugins: {
      prettier: eslintPluginPrettier,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [['#auth', './src']],
          extensions: ['.js', '.json'],
        },
        node: {
          extensions: ['.js'],
        },
      },
    },
    rules: {
      // Import Rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '#auth/**',
              group: 'internal',
              position: 'after',
            },
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',

      // Possible Problems
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-duplicate-imports': 'error',
      'no-constant-binary-expression': 'error',

      // Suggestions
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: true,
          object: true,
        },
      ],

      // Prettier Integration
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          bracketSpacing: true,
          arrowParens: 'avoid',
          endOfLine: 'lf',
        },
      ],

      // ES6
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-confusing-arrow': 'error',

      // Best Practices
      curly: ['error', 'all'],
      'default-case': 'error',
      'dot-notation': 'error',
      'no-else-return': 'error',
      'no-floating-decimal': 'error',
      'no-implicit-coercion': 'error',
    },
  },
  js.configs.recommended,
  prettier,
];

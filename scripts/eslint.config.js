export default [
  {
    rules: {
        'no-console': ['error', { 'allow': ['warn', 'error'] }],
        'camelcase': ['error', { 'properties': 'always' }],
        'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
        'eqeqeq': ['error', 'smart'],
        'indent': ['error', 2, { 'SwitchCase': 1 }],
        'no-throw-literal': ['error'],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'comma-style': ['error', 'last'],
        'comma-dangle': ['error', {
          'arrays': 'always-multiline',
          'objects': 'always-multiline',
          'imports': 'always-multiline',
          'exports': 'always-multiline',
          'functions': 'never'
        }],
        'keyword-spacing': ['error'],
        'no-trailing-spaces': ['error'],
        'no-multi-spaces': ['error'],
        'no-spaced-func': ['error'],
        'no-whitespace-before-property': ['error'],
        'space-before-blocks': ['error'],
        'space-before-function-paren': ['error', {
          'anonymous': 'never',
          'named': 'never',
          'asyncArrow': 'always'
        }],
        'space-in-parens': ['error', 'never'],
        'eol-last': ['error'],
        'quotes': ['error', 'single', { 'avoidEscape': true }],
        'no-implicit-globals': ['error'],
        'no-useless-concat': ['error'],
        'space-infix-ops': ['error', { 'int32Hint': true }],
        'semi-spacing': ['error', { 'before': false, 'after': true }],
        'semi': ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error'],
        'max-len': ['error', 90]
      },

      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    }
]

export default [
    {
        files: ['src/**/*.js', 'scripts/**/*.mjs', 'test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                __APP_VERSION__: 'readonly',
                console: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                process: 'readonly',
                window: 'readonly',
                DOMException: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-undef': 'error',
            'prefer-const': 'warn',
            'no-var': 'error',
            eqeqeq: ['warn', 'smart'],
        },
    },
    {
        // Credits.js predates the lint config and uses `var` in three places.
        // Scoping the exception here keeps `no-var` a hard gate for all new
        // code instead of weakening it project-wide for one file's debt.
        files: ['src/scenes/Credits.js'],
        rules: { 'no-var': 'off' },
    },
];

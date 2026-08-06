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
            'no-var': 'warn',
            eqeqeq: ['warn', 'smart'],
        },
    },
];

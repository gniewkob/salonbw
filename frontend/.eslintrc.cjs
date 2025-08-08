module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    plugins: ['@typescript-eslint'],
    extends: ['next', 'next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
    rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-misused-promises': 'error',
        'no-unused-vars': 'error',
    },
    overrides: [
        {
            files: ['src/__tests__/**/*', 'jest.setup.ts'],
            parserOptions: {
                project: './tsconfig.jest.json',
            },
        },
        {
            files: ['cypress.config.ts', 'tailwind.config.ts'],
            parserOptions: {
                project: null,
            },
        },
    ],
};

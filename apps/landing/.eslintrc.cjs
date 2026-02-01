module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
        'next',
        'next/core-web-vitals',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-misused-promises': 'warn',
        'prettier/prettier': 'off',
        'no-unused-vars': 'warn',
        'react/no-unescaped-entities': 'warn',
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

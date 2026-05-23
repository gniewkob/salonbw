module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/'],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            { tsconfig: 'tsconfig.jest.json', useESM: true },
        ],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    modulePathIgnorePatterns: [
        '<rootDir>/.next/',
        // Prevent jest-haste-map "duplicate manual mock" collisions with sibling
        // apps that vendor the same packages (e.g. apps/landing/vendor/picocolors
        // vs apps/panel/vendor/picocolors). Exclude both vendor dirs so haste
        // never sees duplicate package names.
        '<rootDir>/vendor/',
        '<rootDir>/../landing/',
    ],
    coverageThreshold: {
        global: {
            statements: 70,
            lines: 70,
            functions: 70,
            branches: 60,
        },
    },
};

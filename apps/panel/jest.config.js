module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    workerIdleMemoryLimit: '512MB',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    // This suite uses Node's built-in test runner and is executed explicitly
    // by the MyDevil release packager. Jest must not collect it as a Jest suite.
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
        '/tests/',
        '<rootDir>/scripts/staged-listen-host\\.test\\.cjs$',
    ],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            { tsconfig: 'tsconfig.jest.json', useESM: true },
        ],
    },
    moduleNameMapper: {
        '\\.module\\.css$': '<rootDir>/styleMock.cjs',
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
,
    ],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            { tsconfig: 'tsconfig.jest.json', useESM: true },
        ],
    },
    moduleNameMapper: {
        '\\.module\\.css$': '<rootDir>/styleMock.cjs',
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

module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
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
    transformIgnorePatterns: ['/node_modules/(?!(msw)/)'],
};

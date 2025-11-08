declare global {
    // eslint-disable-next-line no-var
    var assert: ((value: unknown, message?: string) => void) | undefined;
}

if (typeof globalThis.assert !== 'function') {
    globalThis.assert = (value: unknown, message?: string) => {
        if (!value) {
            throw new Error(message ?? 'Assertion failed');
        }
    };
}

import '@suchipi/cypress-plugin-snapshots/commands';
import './commands';

beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
});

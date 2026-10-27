/**
 * Opt-in hosted DEV-only UAT. Deliberately NOT part of playwright.config.ts:
 * ordinary local/CI suites must not authenticate against a deployed instance.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './uat',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    retries: 0,
    workers: 1,
    forbidOnly: true,
    reporter: [['list']],
    use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_BASE_URL,
        locale: 'pl-PL',
        timezoneId: 'Europe/Warsaw',
        viewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: false,
        // Traces/screenshots can include credentials and synthetic customer PII.
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        actionTimeout: 20_000,
    },
    projects: [{ name: 'hosted-dev-uat' }],
});

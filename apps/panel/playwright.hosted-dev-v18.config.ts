/**
 * Hosted, read-only V18 UAT. Never part of synthetic CI or production E2E.
 * No persistent browser artifacts: real DEV may contain imported customer data.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './uat',
    testMatch: 'hosted-dev-v18-customers.pw.ts',
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
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: false,
        serviceWorkers: 'block',
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        actionTimeout: 20_000,
        navigationTimeout: 30_000,
    },
    projects: [{ name: 'hosted-dev-v18-readonly' }],
});

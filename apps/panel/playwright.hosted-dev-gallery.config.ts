/**
 * Explicitly opt-in LIVE DEV browser UAT. Not included in normal CI/E2E.
 * The test itself pins both DEV origins and the exact deployed release.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './uat',
    testMatch: 'hosted-dev-gallery.pw.ts',
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
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        actionTimeout: 20_000,
        navigationTimeout: 30_000,
    },
    projects: [{ name: 'hosted-dev-gallery' }],
});

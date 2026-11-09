/** Guarded hosted DEV communication UAT. No screenshots, traces or video. */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './uat',
    testMatch: 'hosted-dev-communication.pw.ts',
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
        viewport: { width: 1366, height: 900 },
        ignoreHTTPSErrors: false,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
        actionTimeout: 20000,
        navigationTimeout: 30000,
    },
    projects: [{ name: 'hosted-dev-communication' }],
});

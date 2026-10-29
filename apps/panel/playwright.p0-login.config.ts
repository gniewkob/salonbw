import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './uat',
    testMatch: /hosted-dev-client-login\.pw\.ts$/,
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    workers: 1,
    reporter: [['list']],
    timeout: 90_000,
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://dev-panel.salon-bw.pl',
        locale: 'pl-PL',
        timezoneId: 'Europe/Warsaw',
        trace: 'off',
        screenshot: 'off',
        video: 'off',
    },
});

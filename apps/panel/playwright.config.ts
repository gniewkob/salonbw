import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
    use: {
        baseURL,
        locale: 'pl-PL',
        timezoneId: 'Europe/Warsaw',
        colorScheme: 'light',
        animationPolicy: 'disabled',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop-1366',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1366, height: 768 },
            },
        },
        {
            name: 'desktop-1920',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
        },
    ],
    webServer: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : {
              command:
                  'sh -c "NEXT_PUBLIC_API_URL=/api pnpm exec next build && NEXT_PUBLIC_API_URL=/api pnpm exec next start --hostname 127.0.0.1 --port 3100"',
              url: baseURL,
              timeout: 240_000,
              reuseExistingServer: !process.env.CI,
          },
});

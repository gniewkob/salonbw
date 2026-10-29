import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';

// The hosted regression suite must never send DEV gateway secrets to production.
const devGateway = baseURL === 'https://dev-panel.salon-bw.pl' &&
    process.env.DEV_ACCESS_USER === 'uat' &&
    Boolean(process.env.DEV_ACCESS_PASSWORD)
    ? { username: 'uat', password: process.env.DEV_ACCESS_PASSWORD! }
    : undefined;

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
            // Logs in once per role and stores session state for the
            // regression project (login is throttled 5/min server-side —
            // per-test logins caused 429 storms).
            name: 'regression-setup',
            testMatch: /e2e\/regression\/.*\.setup\.ts/,
            use: { ...devices['Desktop Chrome'], httpCredentials: devGateway },
        },
        {
            // Daily-path read-only regression against a live panel.
            name: 'regression',
            testMatch: /e2e\/regression\/.*\.spec\.ts/,
            dependencies: ['regression-setup'],
            use: {
                ...devices['Desktop Chrome'],
                httpCredentials: devGateway,
                viewport: { width: 1366, height: 768 },
            },
        },
        {
            name: 'desktop-1366',
            testIgnore: /e2e\/regression\//,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1366, height: 768 },
            },
        },
        {
            name: 'desktop-1920',
            testIgnore: /e2e\/regression\//,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
        },
        {
            // iPhone 12 / 13 / 14 logical width. Matches the design
            // breakpoint used by useIsMobile (≤767px) for F4 mobile mode.
            name: 'mobile-390',
            testIgnore: /e2e\/regression\//,
            use: {
                ...devices['iPhone 12'],
                viewport: { width: 390, height: 844 },
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

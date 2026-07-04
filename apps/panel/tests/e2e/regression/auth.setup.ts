/**
 * auth.setup.ts — one-time login per role for the regression project.
 *
 * The backend throttles /auth/login (5/min), so logging in from every test
 * caused 429 storms and 35s backoffs that exceeded the 30s test timeout
 * ("Target page closed"). This setup project logs in ONCE per role and
 * saves the session (httpOnly cookies) as storageState; regression specs
 * reuse it via test.use({ storageState }).
 *
 * When credentials are absent (fork PRs), an EMPTY storage state is written
 * so dependent projects can still create contexts — their own skip-guards
 * then skip the tests.
 */

import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAs } from '../helpers/auth';

export const ADMIN_STATE = 'playwright/.auth/admin.json';
export const CLIENT_STATE = 'playwright/.auth/client.json';

const EMPTY_STATE = { cookies: [], origins: [] };

function writeEmptyState(file: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(EMPTY_STATE));
}

setup('authenticate admin', async ({ page }) => {
    setup.setTimeout(180_000); // survives throttle backoffs
    const email =
        process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL ?? '';
    const password =
        process.env.E2E_ADMIN_PASSWORD ??
        process.env.PANEL_LOGIN_PASSWORD ??
        '';
    if (!email || !password) {
        writeEmptyState(ADMIN_STATE);
        setup.skip(true, 'Missing admin credentials');
        return;
    }
    await loginAs(page, email, password);
    await page.context().storageState({ path: ADMIN_STATE });
});

setup('authenticate client', async ({ page }) => {
    setup.setTimeout(180_000);
    const email = process.env.E2E_CLIENT_EMAIL ?? '';
    const password = process.env.E2E_CLIENT_PASSWORD ?? '';
    if (!email || !password) {
        writeEmptyState(CLIENT_STATE);
        setup.skip(true, 'Missing client credentials');
        return;
    }
    await loginAs(page, email, password);
    await page.context().storageState({ path: CLIENT_STATE });
});

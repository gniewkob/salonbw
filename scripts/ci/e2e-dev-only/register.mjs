import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const host = 'https://dev-panel.salon-bw.pl';
const sha = 'd017aebd3f6d0e95100b52d7cdc286507a959892';
const run = String(process.env.GITHUB_RUN_ID ?? '');
if (!/^\d{8,}$/.test(run) ||
    process.env.DEV_ACCESS_USER !== 'uat' ||
    !process.env.DEV_ACCESS_PASSWORD ||
    !process.env.GITHUB_ENV) {
    throw new Error('BLOCKED: missing explicit DEV identity');
}
const auth = 'Basic ' + Buffer.from('uat:' + process.env.DEV_ACCESS_PASSWORD).toString('base64');
const response = await fetch(host + '/__release.json', {
    headers: { Authorization: auth },
    redirect: 'manual',
    signal: AbortSignal.timeout(25000),
});
if (response.status !== 200) throw new Error('BLOCKED: DEV panel release HTTP ' + response.status);
const observed = await response.json();
if (observed.sha !== sha || observed.environment !== 'development')
    throw new Error('BLOCKED: wrong DEV runtime SHA or APP_ENV');
console.log('HOSTED_DEV_RELEASE_EXACT_SHA=PASS');
const email = 'uat-e2e-regression-' + run + '@example.invalid';
const password = randomBytes(32).toString('base64url') + 'A9!';
const registered = await fetch(host + '/api/auth/register', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type':'application/json' },
    redirect: 'manual',
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify({
        email, name: 'UAT Regression ' + run, password,
        gdprConsent: true, termsConsent: true,
        smsConsent: false, emailConsent: false, whatsappConsent: false,
    }),
});
if (registered.status !== 201) {
    console.log('SYNTHETIC_DEV_REGISTRATION=BLOCKED_HTTP_' + registered.status);
    process.exit(2);
}
// Data is synthetic only. Secret only in runner env; never uploaded as artifacts.
console.log('::add-mask::' + password);
appendFileSync(process.env.GITHUB_ENV, 'E2E_CLIENT_EMAIL=' + email + '\n');
appendFileSync(process.env.GITHUB_ENV, 'E2E_CLIENT_PASSWORD=' + password + '\n');
console.log('SYNTHETIC_DEV_REGRESSION_CLIENT=PASS');

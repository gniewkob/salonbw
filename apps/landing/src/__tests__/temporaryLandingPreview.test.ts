import {
    isTemporaryLandingPreviewAllowed,
    LANDING_PREVIEW_EXPIRES_AT,
} from '@/utils/temporaryLandingPreview';

const allowedRequest = {
    host: 'dev.salon-bw.pl',
    appEnvironment: 'development',
    deploymentEnvironment: 'development',
    method: 'GET',
    pathname: '/design-lab',
    now: LANDING_PREVIEW_EXPIRES_AT - 1,
};

describe('temporary DEV-only public Landing design review', () => {
    test.each([
        '/',
        '/design-lab',
        '/services',
        '/services/balayage',
        '/gallery',
        '/images/hero/DSC_9584.jpg',
        '/assets/brand/logo.svg',
        '/_next/data/build-id/design-lab.json',
        '/_next/data/build-id/services.json',
    ])('allows GET on public path %s before the deadline', (pathname) => {
        expect(isTemporaryLandingPreviewAllowed({ ...allowedRequest, pathname })).toBe(true);
    });

    test('expires automatically at the precise deadline', () => {
        expect(isTemporaryLandingPreviewAllowed({ ...allowedRequest, now: LANDING_PREVIEW_EXPIRES_AT })).toBe(false);
        expect(isTemporaryLandingPreviewAllowed({ ...allowedRequest, now: LANDING_PREVIEW_EXPIRES_AT + 1 })).toBe(false);
    });

    test.each([
        { host: 'salon-bw.pl' },
        { host: 'dev-panel.salon-bw.pl' },
        { host: 'dev-api.salon-bw.pl' },
        { host: 'evil.dev.salon-bw.pl' },
        { appEnvironment: 'production' },
        { deploymentEnvironment: 'production' },
        { method: 'POST' },
        { method: 'PUT' },
        { pathname: '/api/services/public' },
        { pathname: '/api/auth/login' },
        { pathname: '/auth/login' },
        { pathname: '/dashboard' },
        { pathname: '/clients' },
        { pathname: '/__release.json' },
        { pathname: '/_next/data/build-id/dashboard.json' },
        { now: Number.NaN },
    ])('rejects unauthorized context %j', (change) => {
        expect(isTemporaryLandingPreviewAllowed({ ...allowedRequest, ...change })).toBe(false);
    });

    test('allows HEAD for public resource but not arbitrary paths', () => {
        expect(isTemporaryLandingPreviewAllowed({ ...allowedRequest, method: 'HEAD' })).toBe(true);
        expect(isTemporaryLandingPreviewAllowed({ ...allowedRequest, pathname: '/missing' })).toBe(false);
    });
});

import {
    getPostLoginRoute,
    getSafeLocalRedirect,
} from '@/utils/postLoginRoute';

describe('getPostLoginRoute', () => {
    it('routes admin to dashboard', () => {
        expect(getPostLoginRoute('admin')).toBe('/dashboard');
    });

    it('routes receptionist and employee to calendar (their primary tool)', () => {
        expect(getPostLoginRoute('receptionist')).toBe('/calendar');
        expect(getPostLoginRoute('employee')).toBe('/calendar');
    });

    it('routes client to their visits panel', () => {
        expect(getPostLoginRoute('client')).toBe('/dashboard');
    });

    it('returns dashboard for unknown role', () => {
        expect(getPostLoginRoute(null)).toBe('/dashboard');
    });
});

describe('booking return destination', () => {
    const { getBookingRedirect } = require('@/utils/postLoginRoute');
    it.each(['/booking', '/booking?serviceId=42'])('preserves %s', (value) =>
        expect(getBookingRedirect(value)).toBe(value),
    );
    it.each([
        undefined,
        [' /booking'],
        'https://outside.invalid/booking',
        '//outside.invalid/booking',
        '/calendar',
        '/\\outside.invalid/booking',
    ])('rejects non-booking targets', (value) =>
        expect(getBookingRedirect(value)).toBeNull(),
    );
});

describe('safe local login destination', () => {
    it.each([
        '/dashboard',
        '/calendar?date=2026-10-27',
        '/booking?serviceId=42',
        '/clients/12#history',
    ])('preserves trusted in-app route %s', (value) => {
        expect(getSafeLocalRedirect(value)).toBe(value);
    });

    it.each([
        null,
        undefined,
        ['//evil.invalid'],
        'https://outside.invalid/booking',
        '//outside.invalid/booking',
        '/\\outside.invalid/booking',
        '/%2Foutside.invalid',
        'javascript:alert(1)',
        '/auth/login',
        '/auth/register',
        ' /booking',
        '/booking\nanything',
    ])('rejects external or auth-loop destination %s', (value) => {
        expect(getSafeLocalRedirect(value)).toBeNull();
    });
});

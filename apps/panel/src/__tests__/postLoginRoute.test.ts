import { getPostLoginRoute } from '@/utils/postLoginRoute';

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

import { getPostLoginRoute } from '@/utils/postLoginRoute';

describe('getPostLoginRoute', () => {
    it('routes admin and receptionist to calendar', () => {
        expect(getPostLoginRoute('admin')).toBe('/calendar');
        expect(getPostLoginRoute('receptionist')).toBe('/calendar');
    });

    it('routes employee to calendar', () => {
        expect(getPostLoginRoute('employee')).toBe('/calendar');
    });

    it('routes client to booking wizard', () => {
        expect(getPostLoginRoute('client')).toBe('/booking');
    });

    it('returns dashboard for unknown role', () => {
        expect(getPostLoginRoute(null)).toBe('/dashboard');
    });
});

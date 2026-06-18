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

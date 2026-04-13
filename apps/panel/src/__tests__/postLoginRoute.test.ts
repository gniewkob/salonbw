import { getPostLoginRoute } from '@/utils/postLoginRoute';

describe('getPostLoginRoute', () => {
    it('returns calendar for admin staff roles', () => {
        expect(getPostLoginRoute('admin')).toBe('/calendar');
        expect(getPostLoginRoute('employee')).toBe('/calendar');
        expect(getPostLoginRoute('receptionist')).toBe('/calendar');
    });

    it('returns dashboard for client and unknown role', () => {
        expect(getPostLoginRoute('client')).toBe('/dashboard');
        expect(getPostLoginRoute(null)).toBe('/dashboard');
    });
});

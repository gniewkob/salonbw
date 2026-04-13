import { getPostLoginRoute } from '@/utils/postLoginRoute';

describe('getPostLoginRoute', () => {
    it('returns calendar for admin staff roles', () => {
        expect(getPostLoginRoute('admin')).toBe('/calendar');
        expect(getPostLoginRoute('employee')).toBe('/calendar');
        expect(getPostLoginRoute('receptionist')).toBe('/calendar');
    });

    it('returns dashboard for customer and unknown role', () => {
        expect(getPostLoginRoute('customer')).toBe('/dashboard');
        expect(getPostLoginRoute(null)).toBe('/dashboard');
    });
});

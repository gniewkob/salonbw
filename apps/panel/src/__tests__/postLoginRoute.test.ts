import { getPostLoginRoute } from '@/utils/postLoginRoute';

describe('getPostLoginRoute', () => {
    it('routes admin and receptionist to calendar-next', () => {
        expect(getPostLoginRoute('admin')).toBe('/calendar-next');
        expect(getPostLoginRoute('receptionist')).toBe('/calendar-next');
    });

    it('keeps employee on legacy calendar during transition', () => {
        expect(getPostLoginRoute('employee')).toBe('/calendar');
    });

    it('returns dashboard for client and unknown role', () => {
        expect(getPostLoginRoute('client')).toBe('/dashboard');
        expect(getPostLoginRoute(null)).toBe('/dashboard');
    });
});

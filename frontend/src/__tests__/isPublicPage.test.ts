import { isPublicPage } from '@/components/Layout';

describe('isPublicPage', () => {
    it('does not mark /services-old as public', () => {
        expect(isPublicPage('/services-old')).toBe(false);
    });

    it('does not mark /gallery123 as public', () => {
        expect(isPublicPage('/gallery123')).toBe(false);
    });
});

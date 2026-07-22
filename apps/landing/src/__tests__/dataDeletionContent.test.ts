import { publicRoutes } from '@/config/publicRoutes';
import { DATA_DELETION } from '@/i18n/dataDeletionContent';
import type { Language } from '@/i18n/translations';

const localeExpectations: Record<Language, RegExp[]> = {
    pl: [/Meta/, /Instagram/, /jednego miesiąca/, /kontakt@salon-bw\.pl/],
    en: [/Meta/, /Instagram/, /one month/, /kontakt@salon-bw\.pl/],
    de: [/Meta/, /Instagram/, /eines Monats/, /kontakt@salon-bw\.pl/],
};

describe.each(Object.keys(localeExpectations) as Language[])(
    'data deletion instructions: %s',
    lang => {
        it('contains the complete, versioned deletion procedure', () => {
            const doc = DATA_DELETION[lang];
            const renderedContent = JSON.stringify(doc.sections);

            expect(doc.sections).toHaveLength(8);
            expect(doc.effectiveDate).toBe('2026-07-22');
            expect(renderedContent).toContain(
                'mailto:kontakt@salon-bw.pl',
            );
            expect(renderedContent).toContain('/privacy');
            localeExpectations[lang].forEach(pattern => {
                expect(renderedContent).toMatch(pattern);
            });
        });
    },
);

it('exposes the deletion instructions as a public route', () => {
    expect(publicRoutes).toContain('/data-deletion');
});

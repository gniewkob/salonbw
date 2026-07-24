import { publicRoutes } from '@/config/publicRoutes';
import { DATA_DELETION } from '@/i18n/dataDeletionContent';
import { LEGAL } from '@/i18n/legalContent';
import type { Language } from '@/i18n/translations';

const localeExpectations: Record<
    Language,
    {
        required: RegExp[];
        unsupportedInstagramClaims: RegExp;
        portability: RegExp;
    }
> = {
    pl: {
        required: [
            /Meta/,
            /Instagram/,
            /Google/,
            /Facebook/,
            /sesj/,
            /jednego miesiąca/,
            /kontakt@salon-bw\.pl/,
        ],
        unsupportedInstagramClaims: /publiczn(?:y|e).*(?:komentarz|polubieni)/i,
        portability: /ustrukturyzowanym.*odczytu maszynowego/i,
    },
    en: {
        required: [
            /Meta/,
            /Instagram/,
            /Google/,
            /Facebook/,
            /sessions/,
            /one month/,
            /kontakt@salon-bw\.pl/,
        ],
        unsupportedInstagramClaims: /public (?:comment|like)/i,
        portability: /structured.*machine-readable/i,
    },
    de: {
        required: [
            /Meta/,
            /Instagram/,
            /Google/,
            /Facebook/,
            /Sitzungen/,
            /eines Monats/,
            /kontakt@salon-bw\.pl/,
        ],
        unsupportedInstagramClaims: /öffentlichen.*(?:Kommentar|Gefällt mir)/i,
        portability: /strukturierten.*maschinenlesbaren/i,
    },
};

describe.each(Object.keys(localeExpectations) as Language[])(
    'data deletion instructions: %s',
    lang => {
        it('contains the complete, versioned deletion procedure', () => {
            const doc = DATA_DELETION[lang];
            const renderedContent = JSON.stringify(doc.sections);

            expect(doc.sections).toHaveLength(11);
            expect(doc.effectiveDate).toBe('2026-07-24');
            expect(renderedContent).toContain(
                'mailto:kontakt@salon-bw.pl',
            );
            expect(renderedContent).toContain('/privacy');
            localeExpectations[lang].required.forEach(pattern => {
                expect(renderedContent).toMatch(pattern);
            });
            expect(renderedContent).not.toMatch(
                localeExpectations[lang].unsupportedInstagramClaims,
            );

            const privacyContent = JSON.stringify(
                LEGAL[lang].privacy.sections,
            );
            expect(privacyContent).toMatch(
                localeExpectations[lang].portability,
            );
        });
    },
);

it('exposes the deletion instructions as a public route', () => {
    expect(publicRoutes).toContain('/data-deletion');
});

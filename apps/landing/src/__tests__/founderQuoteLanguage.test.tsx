import { render, screen, cleanup } from '@testing-library/react';
import { HomeFounder } from '@/components/home/BlackWhiteHome';
import { useLanguage } from '@/contexts/LanguageContext';
import { pl, type Language, type Translations } from '@/i18n/translations';
import en from '@/i18n/translations.en';
import de from '@/i18n/translations.de';

jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: jest.fn(),
}));

jest.mock('@/components/ResponsiveImage', () => ({
    __esModule: true,
    default: () => null,
    webpSrcSet: () => '',
}));

const mockedUseLanguage = useLanguage as jest.MockedFunction<
    typeof useLanguage
>;
const cmsQuote =
    'Od wielu lat stale podnoszę swoje kwalifikacje oraz jakość moich usług, ' +
    'dzięki temu mam stałych zadowolonych klientów. Dołącz do nich i ciesz ' +
    'się pięknem swoich włosów!';

const cases: Array<{
    lang: Language;
    dictionary: Translations;
    expected: string;
    openingMark: string;
    closingMark: string;
}> = [
    {
        lang: 'pl',
        dictionary: pl as unknown as Translations,
        expected: cmsQuote,
        openingMark: '„',
        closingMark: '”',
    },
    {
        lang: 'en',
        dictionary: en,
        expected: en.founder.quote,
        openingMark: '“',
        closingMark: '”',
    },
    {
        lang: 'de',
        dictionary: de,
        expected: de.founder.quote,
        openingMark: '„',
        closingMark: '“',
    },
];

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

describe('Black & White landing founder quote localization', () => {
    test.each(cases)(
        'displays only the complete localized quote with correct punctuation for $lang',
        ({ lang, dictionary, expected, openingMark, closingMark }) => {
            mockedUseLanguage.mockReturnValue({
                lang,
                T: dictionary,
                setLang: jest.fn(),
            });

            render(<HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />);
            const heading = screen.getByRole('heading', { level: 2 });

            expect(heading).toHaveAttribute('id', 'home-founder');
            expect(heading.textContent).toBe(
                `${openingMark}${expected}${closingMark}`,
            );
        },
    );

    it('updates the quote when switching language without changing the CMS source', () => {
        const setLanguage = (lang: Language, T: Translations) => {
            mockedUseLanguage.mockReturnValue({
                lang,
                T,
                setLang: jest.fn(),
            });
        };

        setLanguage('pl', pl as unknown as Translations);
        const view = render(
            <HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />,
        );
        expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
            `„${cmsQuote}”`,
        );

        setLanguage('en', en);
        view.rerender(
            <HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />,
        );
        expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
            `“${en.founder.quote}”`,
        );

        setLanguage('de', de);
        view.rerender(
            <HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />,
        );
        expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
            `„${de.founder.quote}“`,
        );
    });
});

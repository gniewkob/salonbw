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

const mockedUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;
const cmsQuote =
    'Od wielu lat stale podnoszę swoje kwalifikacje oraz jakość moich usług, ' +
    'dzięki temu mam stałych zadowolonych klientów. Dołącz do nich i ciesz ' +
    'się pięknem swoich włosów!';

const cases: Array<{
    lang: Language;
    dictionary: Translations;
    expected: string;
}> = [
    { lang: 'pl', dictionary: pl as unknown as Translations, expected: cmsQuote },
    { lang: 'en', dictionary: en, expected: en.founder.quote },
    { lang: 'de', dictionary: de, expected: de.founder.quote },
];

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

describe('Black & White landing founder quote localization', () => {
    test.each(cases)(
        'displays the correct quote for $lang',
        ({ lang, dictionary, expected }) => {
            mockedUseLanguage.mockReturnValue({
                lang,
                T: dictionary,
                setLang: jest.fn(),
            });

            render(<HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />);
            const heading = screen.getByRole('heading', { level: 2 });

            expect(heading).toHaveAttribute('id', 'home-founder');
            expect(heading).toHaveTextContent(expected);
            if (lang !== 'pl') {
                expect(heading).not.toHaveTextContent(cmsQuote);
            }
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
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
            cmsQuote,
        );

        setLanguage('en', en);
        view.rerender(
            <HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />,
        );
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
            en.founder.quote,
        );

        setLanguage('de', de);
        view.rerender(
            <HomeFounder name="Aleksandra Bodora" quote={cmsQuote} />,
        );
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
            de.founder.quote,
        );
    });
});

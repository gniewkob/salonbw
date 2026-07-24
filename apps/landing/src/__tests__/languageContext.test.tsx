import { fireEvent, render, screen } from '@testing-library/react';
import {
    LanguageProvider,
    useLanguage,
} from '@/contexts/LanguageContext';

function LanguageProbe() {
    const { lang, setLang } = useLanguage();

    return (
        <button type="button" onClick={() => setLang('en')}>
            {lang}
        </button>
    );
}

it('keeps the document language in sync with the selected translation', () => {
    document.documentElement.lang = 'pl';

    render(
        <LanguageProvider>
            <LanguageProbe />
        </LanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'pl' }));

    expect(screen.getByRole('button', { name: 'en' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
});

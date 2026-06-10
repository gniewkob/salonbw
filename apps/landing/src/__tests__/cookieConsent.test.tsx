import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsent from '@/components/CookieConsent';
import { LanguageProvider } from '@/contexts/LanguageContext';

function renderBanner(onDecision = jest.fn()) {
    render(
        <LanguageProvider>
            <CookieConsent onDecision={onDecision} />
        </LanguageProvider>,
    );
    return onDecision;
}

describe('CookieConsent (Consent Mode v2, basic)', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('shows the banner when no decision is stored', () => {
        renderBanner();
        expect(
            screen.getByRole('button', { name: 'Akceptuję' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Tylko niezbędne' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Polityka prywatności' }),
        ).toHaveAttribute('href', '/privacy');
    });

    it('stays hidden when a decision already exists', () => {
        window.localStorage.setItem(
            'sbw-consent',
            JSON.stringify({ analytics: 'denied', decidedAt: '2026-01-01' }),
        );
        renderBanner();
        expect(
            screen.queryByRole('button', { name: 'Akceptuję' }),
        ).not.toBeInTheDocument();
    });

    it('accept stores granted consent and notifies the app', () => {
        const onDecision = renderBanner();
        fireEvent.click(screen.getByRole('button', { name: 'Akceptuję' }));
        const stored = JSON.parse(
            window.localStorage.getItem('sbw-consent') ?? '{}',
        );
        expect(stored.analytics).toBe('granted');
        expect(onDecision).toHaveBeenCalledWith(true);
        expect(
            screen.queryByRole('button', { name: 'Akceptuję' }),
        ).not.toBeInTheDocument();
    });

    it('decline stores denied consent — no GA may load afterwards', () => {
        const onDecision = renderBanner();
        fireEvent.click(
            screen.getByRole('button', { name: 'Tylko niezbędne' }),
        );
        const stored = JSON.parse(
            window.localStorage.getItem('sbw-consent') ?? '{}',
        );
        expect(stored.analytics).toBe('denied');
        expect(onDecision).toHaveBeenCalledWith(false);
    });
});

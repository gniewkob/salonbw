import { act, fireEvent, render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';

jest.mock('@/components/BookingModal', () => ({
    __esModule: true,
    default: () => null,
}));

function renderFooter() {
    render(
        <LanguageProvider>
            <Footer />
        </LanguageProvider>,
    );
}

describe('Footer navigation', () => {
    const scrollTo = jest.fn();

    beforeEach(() => {
        scrollTo.mockClear();
        window.scrollTo = scrollTo;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.documentElement.style.removeProperty('scroll-behavior');
    });

    it('resets the page position for a regular internal page link', () => {
        const frames: FrameRequestCallback[] = [];
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(
            callback => {
                frames.push(callback);
                return frames.length;
            },
        );
        document.documentElement.style.scrollBehavior = 'smooth';
        renderFooter();

        fireEvent.click(
            screen.getAllByRole('link', {
                name: 'Polityka prywatności',
            })[0],
        );

        expect(document.documentElement.style.scrollBehavior).toBe('auto');
        expect(scrollTo).not.toHaveBeenCalled();

        act(() => {
            frames.shift()?.(0);
        });
        expect(scrollTo).toHaveBeenCalledWith(0, 0);
        expect(document.documentElement.style.scrollBehavior).toBe('auto');

        frames.shift()?.(16);
        expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });

    it('preserves anchor and modified-click browser behavior', () => {
        renderFooter();

        fireEvent.click(screen.getByRole('link', { name: 'O nas' }));
        fireEvent.click(
            screen.getAllByRole('link', {
                name: 'Polityka prywatności',
            })[0],
            { ctrlKey: true },
        );

        expect(scrollTo).not.toHaveBeenCalled();
    });
});

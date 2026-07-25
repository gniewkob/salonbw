import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';

const mockedUseRouter = jest.mocked(useRouter);

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
    const push = jest.fn();

    beforeEach(() => {
        scrollTo.mockClear();
        push.mockReset();
        mockedUseRouter.mockReturnValue({ push } as never);
        window.scrollTo = scrollTo;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.documentElement.style.removeProperty('scroll-behavior');
    });

    it('resets the page position after internal navigation completes', async () => {
        const frames: FrameRequestCallback[] = [];
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(
            (callback) => {
                frames.push(callback);
                return frames.length;
            },
        );
        let completeNavigation: ((value: boolean) => void) | undefined;
        push.mockReturnValue(
            new Promise<boolean>((resolve) => {
                completeNavigation = resolve;
            }),
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
        expect(push).toHaveBeenCalledWith('/privacy', undefined, {
            scroll: false,
        });

        act(() => {
            completeNavigation?.(true);
        });
        await act(async () => {
            await Promise.resolve();
        });
        expect(scrollTo).toHaveBeenCalledWith(0, 0);
        expect(document.documentElement.style.scrollBehavior).toBe('auto');

        act(() => {
            frames.shift()?.(16);
        });
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
        expect(push).not.toHaveBeenCalled();
    });
});

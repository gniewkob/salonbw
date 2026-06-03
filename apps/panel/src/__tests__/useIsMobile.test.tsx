import { act, renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MockMediaQueryList {
    matches: boolean;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    fireChange: (matches: boolean) => void;
}

function installMatchMediaMock(initialMatches: boolean): MockMediaQueryList {
    let handler: ((event: MediaQueryListEvent) => void) | null = null;
    const mock: MockMediaQueryList = {
        matches: initialMatches,
        addEventListener: jest.fn((_event, h: typeof handler) => {
            handler = h;
        }),
        removeEventListener: jest.fn(() => {
            handler = null;
        }),
        fireChange(matches: boolean) {
            mock.matches = matches;
            handler?.({ matches } as MediaQueryListEvent);
        },
    };

    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: jest.fn().mockReturnValue(mock),
    });

    return mock;
}

describe('useIsMobile', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reports the initial matchMedia value after mount', () => {
        installMatchMediaMock(true);
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(true);
    });

    it('updates when matchMedia change fires', () => {
        const media = installMatchMediaMock(false);
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);

        act(() => {
            media.fireChange(true);
        });
        expect(result.current).toBe(true);
    });

    it('removes the listener on unmount', () => {
        const media = installMatchMediaMock(true);
        const { unmount } = renderHook(() => useIsMobile());
        expect(media.addEventListener).toHaveBeenCalledTimes(1);
        unmount();
        expect(media.removeEventListener).toHaveBeenCalledTimes(1);
    });

    it('keeps initial false when matchMedia is unavailable', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            configurable: true,
            value: undefined,
        });
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });
});

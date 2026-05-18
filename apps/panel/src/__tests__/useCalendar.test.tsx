import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    function Wrapper({ children }: PropsWithChildren) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }
    Wrapper.displayName = 'QueryWrapper';
    return Wrapper;
}

function readDateParamFromEndpoint(endpoint: string): string | null {
    const [, queryString = ''] = endpoint.split('?');
    const params = new URLSearchParams(queryString);
    return params.get('date');
}

describe('useCalendar date normalization', () => {
    it.each([
        ['2026-05-20', '2026-05-20T00:00:00.000Z'],
        ['2026-05-20T10:30:45', '2026-05-20T10:30:45.000Z'],
        ['2026-05-20T10:30:45.123', '2026-05-20T10:30:45.123Z'],
        ['2026-05-20T10:30:45.123Z', '2026-05-20T10:30:45.123Z'],
    ])(
        'sends normalized date for "%s" as "%s"',
        async (inputDate, expectedDate) => {
            const apiFetch = jest.fn().mockResolvedValue({
                events: [],
                employees: [],
                dateRange: { start: '2026-05-20', end: '2026-05-20' },
            });
            mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

            const { result } = renderHook(
                () =>
                    useCalendar({
                        date: inputDate,
                    }),
                { wrapper: createWrapper() },
            );

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(apiFetch).toHaveBeenCalledTimes(1);

            const endpoint = apiFetch.mock.calls[0][0] as string;
            expect(readDateParamFromEndpoint(endpoint)).toBe(expectedDate);
        },
    );
});

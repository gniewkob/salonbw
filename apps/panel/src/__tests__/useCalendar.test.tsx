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
        ['2026-05-20', '2026-05-20'],
        ['2026-05-20T10:30:45', '2026-05-20'],
        ['2026-05-20T10:30:45.123', '2026-05-20'],
        ['2026-05-20T10:30:45.123Z', '2026-05-20'],
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

describe('useCalendar period integrity', () => {
    const viewParam = (endpoint: string) =>
        new URLSearchParams(endpoint.split('?')[1] ?? '').get('view');

    it.each(['week', 'month'] as const)(
        'never substitutes a one-day response for a rejected %s view',
        async (view) => {
            const apiError = Object.assign(
                new Error('Calendar query rejected'),
                { status: 400 },
            );
            const apiFetch = jest.fn().mockRejectedValue(apiError);
            mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

            const { result } = renderHook(
                () => useCalendar({ date: '2026-11-09', view }),
                { wrapper: createWrapper() },
            );

            await waitFor(() => expect(result.current.error).not.toBeNull());
            expect(result.current.data).toBeNull();
            expect(apiFetch).toHaveBeenCalledTimes(2);
            expect(
                apiFetch.mock.calls.map(([endpoint]) =>
                    viewParam(endpoint as string),
                ),
            ).toEqual([view, view]);
        },
    );

    it('keeps the legacy reception-to-day fallback for a day request', async () => {
        const apiError = Object.assign(new Error('Bad reception view'), {
            status: 400,
        });
        const data = {
            events: [],
            employees: [],
            dateRange: { start: '2026-11-09', end: '2026-11-09' },
        };
        const apiFetch = jest
            .fn()
            .mockRejectedValueOnce(apiError)
            .mockRejectedValueOnce(apiError)
            .mockResolvedValueOnce(data);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

        const { result } = renderHook(
            () => useCalendar({ date: '2026-11-09', view: 'day' }),
            { wrapper: createWrapper() },
        );

        await waitFor(() => expect(result.current.data).toEqual(data));
        expect(result.current.error).toBeNull();
        expect(
            apiFetch.mock.calls.map(([endpoint]) =>
                viewParam(endpoint as string),
            ),
        ).toEqual(['reception', 'reception', 'day']);
    });

    it('preserves a successful full-week response without retry or downgrade', async () => {
        const data = {
            events: [],
            employees: [],
            dateRange: { start: '2026-11-09', end: '2026-11-15' },
        };
        const apiFetch = jest.fn().mockResolvedValue(data);
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));

        const { result } = renderHook(
            () => useCalendar({ date: '2026-11-09', view: 'week' }),
            { wrapper: createWrapper() },
        );

        await waitFor(() => expect(result.current.data).toEqual(data));
        expect(result.current.error).toBeNull();
        expect(apiFetch).toHaveBeenCalledTimes(1);
        expect(viewParam(apiFetch.mock.calls[0][0] as string)).toBe('week');
    });
});

describe('useCalendar V18 operational staff opt-in', () => {
    it.each([
        [true, 'true'],
        [false, null],
    ])('sets the operational flag only when %s', async (enabled, expected) => {
        const apiFetch = jest.fn().mockResolvedValue({
            events: [],
            employees: [],
            dateRange: { start: '2026-11-12', end: '2026-11-12' },
        });
        mockedUseAuth.mockReturnValue(createAuthValue({ apiFetch }));
        const { result } = renderHook(
            () =>
                useCalendar({
                    date: '2026-11-12',
                    view: 'day',
                    operationalStaffOnly: enabled,
                }),
            { wrapper: createWrapper() },
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        const endpoint = apiFetch.mock.calls[0][0] as string;
        expect(
            new URLSearchParams(endpoint.split('?')[1] ?? '').get(
                'operationalStaffOnly',
            ),
        ).toBe(expected);
    });
});

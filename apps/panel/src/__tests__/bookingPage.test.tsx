import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import BookingPage from '@/pages/booking';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const push = jest.fn();

jest.mock('next/router', () => ({
    useRouter: () => ({ push, replace: jest.fn(), query: {} }),
}));

jest.mock('@/contexts/AuthContext');

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const SERVICES = [
    {
        id: 1,
        name: 'Strzyżenie',
        duration: 45,
        price: 120,
        priceType: 'fixed',
        category: 'Włosy',
    },
];

const SERVICES_WITH_VARIANT_AND_ADDON = [
    {
        id: 1,
        name: 'Strzyżenie',
        duration: 60,
        price: 140,
        priceType: 'fixed',
        category: 'Włosy',
        variants: [
            {
                id: 11,
                name: 'Długie włosy',
                duration: 90,
                price: 180,
                priceType: 'fixed',
                isActive: true,
            },
        ],
    },
    {
        id: 2,
        name: 'Pielęgnacja regenerująca',
        duration: 30,
        price: 80,
        priceType: 'fixed',
        category: 'Pielęgnacja',
    },
];

const FLAT_VARIANT_SERVICES_WITH_ADDON = [
    {
        id: 101,
        name: 'Fryzura wieczorowa – włosy średnie',
        duration: 80,
        price: 200,
        priceType: 'fixed',
        category: 'Fryzjerstwo',
    },
    {
        id: 102,
        name: 'Fryzura wieczorowa – włosy długie',
        duration: 80,
        price: 250,
        priceType: 'fixed',
        category: 'Fryzjerstwo',
    },
    {
        id: 103,
        name: 'Fryzura wieczorowa – włosy bardzo długie',
        duration: 80,
        price: 280,
        priceType: 'fixed',
        category: 'Fryzjerstwo',
    },
    {
        id: 2,
        name: 'Pielęgnacja regenerująca',
        duration: 30,
        price: 80,
        priceType: 'fixed',
        category: 'Pielęgnacja',
    },
];

const SLOTS = [
    {
        employeeId: 7,
        employeeName: 'Anna',
        time: '2026-05-23T09:00:00.000Z',
    },
];

function toISODateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function addDaysISO(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    return toISODateLocal(d);
}

describe('BookingPage reservedOnline payload', () => {
    beforeEach(() => {
        push.mockReset();
    });

    it.each([
        ['client', true],
        ['admin', false],
        ['employee', false],
        ['receptionist', false],
    ] as const)(
        'sends reservedOnline=%s rule for role %s',
        async (role, expectedReservedOnline) => {
            const apiFetch = jest.fn(async (path: string) => {
                if (path === '/services/online-booking') return SERVICES;
                if (path.startsWith('/calendar/available-slots')) return SLOTS;
                return { id: 123 };
            });

            mockedUseAuth.mockReturnValue(
                createAuthValue({
                    role,
                    isAuthenticated: true,
                    apiFetch: apiFetch as ReturnType<
                        typeof createAuthValue
                    >['apiFetch'],
                }),
            );

            render(<BookingPage />);

            const serviceButton = await screen.findByRole('button', {
                name: /strzyżenie/i,
            });
            fireEvent.click(serviceButton);

            fireEvent.click(
                await screen.findByRole('button', {
                    name: /przejdź do terminu/i,
                }),
            );

            const slotButton = await screen.findByRole('button', {
                name: /\d{2}:\d{2}/,
            });
            expect(
                screen.getByRole('button', { name: /następny dzień/i }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('button', { name: /poprzedni dzień/i }),
            ).toBeInTheDocument();
            fireEvent.click(slotButton);

            fireEvent.click(
                screen.getByRole('button', { name: /potwierdź rezerwację/i }),
            );

            await waitFor(() => {
                expect(apiFetch).toHaveBeenCalledWith(
                    '/appointments',
                    expect.objectContaining({ method: 'POST' }),
                );
            });

            const postCall = apiFetch.mock.calls.find(
                ([path]) => path === '/appointments',
            );
            expect(postCall).toBeDefined();
            const payload = JSON.parse(
                (postCall?.[1] as { body: string }).body,
            ) as {
                reservedOnline: boolean;
            };

            expect(payload.reservedOnline).toBe(expectedReservedOnline);
        },
    );

    it('sends selected variant and add-ons to slots and appointment APIs', async () => {
        const apiFetch = jest.fn(async (path: string) => {
            if (path === '/services/online-booking') {
                return SERVICES_WITH_VARIANT_AND_ADDON;
            }
            if (path.startsWith('/calendar/available-slots')) return SLOTS;
            return { id: 123 };
        });

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                user: {
                    id: 99,
                    name: 'Jan Klient',
                    email: 'jan@example.test',
                    role: 'client',
                    phone: '123456789',
                },
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<BookingPage />);

        fireEvent.click(
            await screen.findByRole('button', { name: /strzyżenie/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', { name: /długie włosy/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', {
                name: /pielęgnacja regenerująca/i,
            }),
        );
        await screen.findByText('120 min');
        fireEvent.click(
            screen.getByRole('button', { name: /przejdź do terminu/i }),
        );

        await waitFor(() => {
            expect(
                apiFetch.mock.calls.some(
                    ([path]) =>
                        typeof path === 'string' &&
                        path.startsWith('/calendar/available-slots') &&
                        path.includes('serviceVariantId=11') &&
                        path.includes('addonServiceIds=2'),
                ),
            ).toBe(true);
        });

        fireEvent.click(
            await screen.findByRole('button', { name: /\d{2}:\d{2}/ }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /potwierdź rezerwację/i }),
        );

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/appointments',
                expect.objectContaining({ method: 'POST' }),
            );
        });

        const postCall = apiFetch.mock.calls.find(
            ([path]) => path === '/appointments',
        );
        const payload = JSON.parse(
            (postCall?.[1] as { body: string }).body,
        ) as {
            serviceVariantId: number;
            addonServiceIds: number[];
        };

        expect(payload.serviceVariantId).toBe(11);
        expect(payload.addonServiceIds).toEqual([2]);
    });

    it('groups flat catalog variants into service then variant steps', async () => {
        const apiFetch = jest.fn(async (path: string) => {
            if (path === '/services/online-booking') {
                return FLAT_VARIANT_SERVICES_WITH_ADDON;
            }
            if (path.startsWith('/calendar/available-slots')) return SLOTS;
            return { id: 123 };
        });

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<BookingPage />);

        expect(
            await screen.findByRole('button', {
                name: /fryzura wieczorowa/i,
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: /fryzura wieczorowa – włosy średnie/i,
            }),
        ).not.toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: /fryzura wieczorowa/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', { name: /włosy długie/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', {
                name: /pielęgnacja regenerująca/i,
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /przejdź do terminu/i }),
        );

        await waitFor(() => {
            expect(
                apiFetch.mock.calls.some(([path]) => {
                    if (
                        typeof path !== 'string' ||
                        !path.startsWith('/calendar/available-slots')
                    ) {
                        return false;
                    }
                    const params = new URLSearchParams(path.split('?')[1]);
                    return (
                        params.get('serviceId') === '102' &&
                        params.get('serviceVariantId') === null &&
                        params.get('addonServiceIds') === '2'
                    );
                }),
            ).toBe(true);
        });

        fireEvent.click(
            await screen.findByRole('button', { name: /\d{2}:\d{2}/ }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /potwierdź rezerwację/i }),
        );

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/appointments',
                expect.objectContaining({ method: 'POST' }),
            );
        });

        const postCall = apiFetch.mock.calls.find(
            ([path]) => path === '/appointments',
        );
        const payload = JSON.parse(
            (postCall?.[1] as { body: string }).body,
        ) as {
            serviceId: number;
            serviceVariantId?: number;
            addonServiceIds: number[];
        };

        expect(payload.serviceId).toBe(102);
        expect(payload.serviceVariantId).toBeUndefined();
        expect(payload.addonServiceIds).toEqual([2]);
    });

    it('jumps to the nearest day with slots for the selected total duration', async () => {
        const today = toISODateLocal(new Date());
        const tomorrow = addDaysISO(today, 1);
        const apiFetch = jest.fn(async (path: string) => {
            if (path === '/services/online-booking') {
                return SERVICES_WITH_VARIANT_AND_ADDON;
            }
            if (path.startsWith('/calendar/available-slots')) {
                const params = new URLSearchParams(path.split('?')[1]);
                if (params.get('date') === today) return [];
                return [
                    {
                        employeeId: 7,
                        employeeName: 'Anna',
                        time: `${tomorrow}T09:00:00.000Z`,
                    },
                ];
            }
            return { id: 123 };
        });

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<BookingPage />);

        fireEvent.click(
            await screen.findByRole('button', { name: /strzyżenie/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', { name: /długie włosy/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', {
                name: /pielęgnacja regenerująca/i,
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /przejdź do terminu/i }),
        );

        await screen.findByText(/pokazujemy najbliższy wolny termin/i);

        const slotCalls = apiFetch.mock.calls
            .map(([path]) => String(path))
            .filter((path) => path.startsWith('/calendar/available-slots'));

        expect(slotCalls[0]).toContain(`date=${today}`);
        expect(
            slotCalls.some((path) => path.includes(`date=${tomorrow}`)),
        ).toBe(true);
        expect(
            slotCalls.some(
                (path) =>
                    path.includes(`date=${today}`) &&
                    path.includes('serviceVariantId=11') &&
                    path.includes('addonServiceIds=2'),
            ),
        ).toBe(true);
        expect(
            slotCalls.some(
                (path) =>
                    path.includes(`date=${tomorrow}`) &&
                    path.includes('serviceVariantId=11') &&
                    path.includes('addonServiceIds=2'),
            ),
        ).toBe(true);
    });

    it('lets the client ask the salon for help finding a suitable slot', async () => {
        const apiFetch = jest.fn(async (path: string) => {
            if (path === '/services/online-booking') {
                return SERVICES_WITH_VARIANT_AND_ADDON;
            }
            if (path.startsWith('/calendar/available-slots')) return [];
            if (path === '/emails/contact') return { status: 'ok' };
            return { id: 123 };
        });

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                user: {
                    id: 99,
                    name: 'Jan Klient',
                    email: 'jan@example.test',
                    role: 'client',
                    phone: '123456789',
                },
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<BookingPage />);

        fireEvent.click(
            await screen.findByRole('button', { name: /strzyżenie/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', { name: /długie włosy/i }),
        );
        fireEvent.click(
            await screen.findByRole('button', {
                name: /pielęgnacja regenerująca/i,
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: /przejdź do terminu/i }),
        );

        fireEvent.change(await screen.findByLabelText(/preferencje terminu/i), {
            target: { value: 'Najchętniej piątek po 16:00.' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: /poproś o pomoc/i }),
        );

        await screen.findByText(/prośba została wysłana/i);

        const contactCall = apiFetch.mock.calls.find(
            ([path]) => path === '/emails/contact',
        );
        expect(contactCall).toBeDefined();
        const payload = JSON.parse(
            (contactCall?.[1] as { body: string }).body,
        ) as {
            name: string;
            replyTo: string;
            message: string;
        };

        expect(payload.name).toBe('Jan Klient');
        expect(payload.replyTo).toBe('jan@example.test');
        expect(payload.message).toContain('Strzyżenie');
        expect(payload.message).toContain('Długie włosy');
        expect(payload.message).toContain('Pielęgnacja regenerująca');
        expect(payload.message).toContain('Łączny czas wizyty: 120 min');
        expect(payload.message).toContain('Najchętniej piątek po 16:00.');
    });
});

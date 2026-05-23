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

const SLOTS = [
    {
        employeeId: 7,
        employeeName: 'Anna',
        time: '2026-05-23T09:00:00.000Z',
    },
];

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

            const slotButton = await screen.findByRole('button', {
                name: /\d{2}:\d{2}/,
            });
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
});

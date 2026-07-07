import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SalonTopbar from '@/components/salon/SalonTopbar';

const push = jest.fn();
const eventsOn = jest.fn();
const eventsOff = jest.fn();
const pendingCountMock = jest.fn(() => 22);
const apiFetchMock = jest.fn();
let topbarUser: {
    id: number;
    name: string;
    role: 'admin';
    avatarUrl?: string;
} = { id: 1, name: 'QA User', role: 'admin' };

jest.mock('next/router', () => ({
    useRouter: () => ({
        push,
        events: {
            on: eventsOn,
            off: eventsOff,
        },
    }),
}));

jest.mock('@/hooks/useAppointments', () => ({
    usePendingBookingsCount: () => pendingCountMock(),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: topbarUser,
        isAuthenticated: true,
        logout: jest.fn().mockResolvedValue(undefined),
        apiFetch: apiFetchMock,
    }),
}));

function renderTopbar() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <SalonTopbar />
        </QueryClientProvider>,
    );
}

describe('SalonTopbar tasks tooltip', () => {
    beforeEach(() => {
        push.mockReset();
        apiFetchMock.mockReset();
        apiFetchMock.mockResolvedValue([]);
        pendingCountMock.mockReturnValue(22);
        topbarUser = { id: 1, name: 'QA User', role: 'admin' };
    });

    it('shows pending confirmations entry in tasks tooltip', () => {
        renderTopbar();

        fireEvent.click(screen.getByTitle('Twoje zadania'));

        expect(
            screen.getByText('Wizyty oczekujące na potwierdzenie'),
        ).toBeInTheDocument();
        expect(screen.getByText('22')).toBeInTheDocument();
    });

    it('shows empty state when there are no pending confirmations', () => {
        pendingCountMock.mockReturnValue(0);
        renderTopbar();

        fireEvent.click(screen.getByTitle('Twoje zadania'));

        expect(
            screen.getByText('Brak oczekujących wizyt.'),
        ).toBeInTheDocument();
    });

    it('uses profile photo in the topbar button when avatar is available', () => {
        topbarUser = {
            id: 1,
            name: 'QA User',
            role: 'admin',
            avatarUrl: 'https://example.com/avatar.jpg',
        };

        const { container } = renderTopbar();

        const button = container.querySelector('.e2e-nav-user-dropdown');
        const avatar = button?.querySelector('img.color1--img');

        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        expect(button).not.toHaveTextContent('QU');
    });

    it('shows customers, employees and products in global search', async () => {
        apiFetchMock.mockImplementation((path: string) => {
            if (path.startsWith('/customers')) {
                return Promise.resolve({
                    items: [
                        {
                            id: 11,
                            name: 'Bogumiła Grabowy',
                            phone: '+48123123123',
                        },
                    ],
                });
            }
            if (path === '/employees/staff-options') {
                return Promise.resolve([
                    {
                        id: 7,
                        name: 'Aleksandra Bodora',
                        role: 'employee',
                    },
                ]);
            }
            if (path.startsWith('/products')) {
                return Promise.resolve([
                    {
                        id: 31,
                        name: 'Bodora Shampoo',
                        brand: 'SalonBW',
                        sku: 'BOD-SHAMPOO',
                        unitPrice: 100,
                        stock: 4,
                        lowStockThreshold: 1,
                    },
                ]);
            }
            return Promise.resolve([]);
        });

        renderTopbar();

        fireEvent.change(
            screen.getByLabelText('Szukaj klientów, pracowników i produktów'),
            {
                target: { value: 'bo' },
            },
        );

        await waitFor(() => {
            expect(screen.getByText('Klienci (1)')).toBeInTheDocument();
            expect(screen.getByText('Pracownicy (1)')).toBeInTheDocument();
            expect(screen.getByText('Produkty (1)')).toBeInTheDocument();
        });

        expect(screen.getByText('Bogumiła Grabowy')).toBeInTheDocument();
        expect(screen.getByText('Aleksandra Bodora')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Bodora Shampoo'));

        expect(push).toHaveBeenCalledWith('/products/31');
    });
});

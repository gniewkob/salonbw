import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import V18CustomerBooking from '@/components/v18/V18CustomerBooking';

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(),
}));
jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));
jest.mock('@/components/calendar/AppointmentDrawer', () => ({
    __esModule: true,
    default: ({
        initialClientId,
        initialClientName,
        lockClientSelection,
        visualVariant,
    }: {
        initialClientId: number;
        initialClientName?: string;
        lockClientSelection?: boolean;
        visualVariant?: string;
    }) => (
        <div
            data-testid="customer-booking-drawer"
            data-client-id={initialClientId}
            data-client-name={initialClientName}
            data-lock-client={String(lockClientSelection)}
            data-variant={visualVariant}
        />
    ),
}));

describe('V18 booking launched from a customer context', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useQueryClient as jest.Mock).mockReturnValue({
            invalidateQueries: jest.fn(),
        });
    });

    it.each(['admin', 'employee', 'receptionist'] as const)(
        'preselects the customer but permits %s staff to change it',
        (role) => {
            jest.mocked(useAuth).mockReturnValue({
                role,
            } as ReturnType<typeof useAuth>);

            render(
                <V18CustomerBooking
                    customerId={23}
                    customerName="Klient syntetyczny"
                    onClose={jest.fn()}
                />,
            );

            const drawer = screen.getByTestId('customer-booking-drawer');
            expect(drawer).toHaveAttribute('data-client-id', '23');
            expect(drawer).toHaveAttribute(
                'data-client-name',
                'Klient syntetyczny',
            );
            expect(drawer).toHaveAttribute('data-lock-client', 'false');
            expect(drawer).toHaveAttribute('data-variant', 'v18');
        },
    );

    it.each(['client', null] as const)(
        'keeps client selection locked for role %s',
        (role) => {
            jest.mocked(useAuth).mockReturnValue({
                role,
            } as ReturnType<typeof useAuth>);

            render(
                <V18CustomerBooking
                    customerId={23}
                    customerName="Klient syntetyczny"
                    onClose={jest.fn()}
                />,
            );

            const drawer = screen.getByTestId('customer-booking-drawer');
            expect(drawer).toHaveAttribute('data-client-id', '23');
            expect(drawer).toHaveAttribute('data-lock-client', 'true');
            expect(drawer).toHaveAttribute('data-variant', 'v18');
        },
    );
});

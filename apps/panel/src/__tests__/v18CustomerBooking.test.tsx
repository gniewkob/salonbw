import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import V18CustomerBooking from '@/components/v18/V18CustomerBooking';

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(),
}));
jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ role: 'admin' }),
}));
jest.mock('@/components/calendar/AppointmentDrawer', () => ({
    __esModule: true,
    default: ({
        initialClientId,
        lockClientSelection,
        visualVariant,
    }: {
        initialClientId: number;
        lockClientSelection?: boolean;
        visualVariant?: string;
    }) => (
        <div
            data-testid="customer-booking-drawer"
            data-client-id={initialClientId}
            data-lock-client={String(lockClientSelection)}
            data-variant={visualVariant}
        />
    ),
}));

describe('V18 booking launched from a customer context', () => {
    it('pins the original customer even for an administrator', () => {
        (useQueryClient as jest.Mock).mockReturnValue({
            invalidateQueries: jest.fn(),
        });
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
    });
});

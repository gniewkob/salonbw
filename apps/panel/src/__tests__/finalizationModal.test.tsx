import { fireEvent, render, screen } from '@testing-library/react';
import FinalizationModal from '@/components/calendar/FinalizationModal';

const apiFetchMock = jest.fn();
const mutateMock = jest.fn();
const invalidateMock = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ apiFetch: apiFetchMock }),
}));

jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({
        open,
        children,
    }: {
        open: boolean;
        children: React.ReactNode;
    }) => (open ? <div>{children}</div> : null),
}));

jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(() => ({ data: [] })),
    useMutation: jest.fn(() => ({
        mutate: mutateMock,
        isPending: false,
        isError: false,
    })),
    useQueryClient: jest.fn(() => ({
        invalidateQueries: invalidateMock,
    })),
}));

describe('FinalizationModal', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        mutateMock.mockReset();
        invalidateMock.mockReset();
    });

    it('blocks finalization when discount exceeds service + products total', () => {
        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Jan Kowalski' },
                }}
                onClose={jest.fn()}
            />,
        );

        fireEvent.change(screen.getAllByPlaceholderText('0.00')[0], {
            target: { value: '200' },
        });
        expect(
            screen.getByText(
                'Maksymalny rabat dla tej finalizacji to 120.00 PLN.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Zakończ wizytę' }),
        ).toBeDisabled();
        expect(mutateMock).not.toHaveBeenCalled();
    });

    it('submits finalize payload with cents values', () => {
        render(
            <FinalizationModal
                open
                appointment={{
                    id: 7,
                    startTime: '2026-05-01T10:00:00.000Z',
                    status: 'in_progress',
                    service: {
                        id: 10,
                        name: 'Strzyżenie',
                        duration: 45,
                        price: 120,
                        priceType: 'fixed',
                        isActive: true,
                        onlineBooking: true,
                        sortOrder: 0,
                    },
                    client: { id: 5, name: 'Jan Kowalski' },
                }}
                onClose={jest.fn()}
            />,
        );

        const amountInputs = screen.getAllByPlaceholderText('0.00');
        fireEvent.change(amountInputs[0], { target: { value: '10' } }); // discount
        fireEvent.change(amountInputs[1], { target: { value: '5' } }); // tip
        fireEvent.click(screen.getByRole('button', { name: 'Zakończ wizytę' }));

        expect(mutateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentMethod: 'card',
                paidAmountCents: 11500,
                tipAmountCents: 500,
                discountCents: 1000,
            }),
        );
    });
});

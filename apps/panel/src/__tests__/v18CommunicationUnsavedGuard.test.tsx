import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCustomer,
    useDeleteCustomer,
    useUpdateCustomer,
} from '@/hooks/useCustomers';
import V18EditCustomerModal from '@/components/v18/V18EditCustomerModal';

jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useCustomers', () => ({
    useCustomer: jest.fn(),
    useDeleteCustomer: jest.fn(),
    useUpdateCustomer: jest.fn(),
}));
jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({
        open,
        onClose,
        children,
    }: {
        open: boolean;
        onClose: () => void;
        children: React.ReactNode;
    }) =>
        open ? (
            <div role="dialog" aria-label="Edycja">
                <button type="button" onClick={onClose}>
                    Symuluj zamknięcie tła
                </button>
                {children}
            </div>
        ) : null,
}));
jest.mock('@/components/customers/CustomerPersonalDataTab', () => ({
    __esModule: true,
    default: ({ onUpdate }: { onUpdate: (data: { name: string }) => Promise<void> }) => (
        <button type="button" onClick={() => void onUpdate({ name: 'Klient UAT' })}>
            Zapisz testowe dane klienta
        </button>
    ),
}));
jest.mock(
    '@/components/communication/CustomerCommunicationPreferences',
    () => ({
        __esModule: true,
        default: ({
            onDirtyChange,
        }: {
            onDirtyChange?: (dirty: boolean) => void;
        }) => (
            <div>
                <button type="button" onClick={() => onDirtyChange?.(true)}>
                    Zmień preferencję testową
                </button>
                <button type="button" onClick={() => onDirtyChange?.(false)}>
                    Przywróć preferencję testową
                </button>
            </div>
        ),
    }),
);

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({ role: 'admin' } as ReturnType<
        typeof useAuth
    >);
    jest.mocked(useCustomer).mockReturnValue({
        data: { id: 20, name: 'Klient UAT' },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
    } as unknown as ReturnType<typeof useCustomer>);
    jest.mocked(useUpdateCustomer).mockReturnValue({
        isPending: false,
        mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useUpdateCustomer>);
    jest.mocked(useDeleteCustomer).mockReturnValue({
        isPending: false,
        mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useDeleteCustomer>);
});

describe('V18 customer editor — unsaved communication preferences', () => {
    it('does not silently discard changed preferences on close or backdrop click', () => {
        const onClose = jest.fn();
        render(
            <V18EditCustomerModal
                open
                customerId={20}
                initialTab="communication"
                onClose={onClose}
                onSuccess={jest.fn()}
                onDeleted={jest.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Zmień preferencję testową' }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij edycję klienta' }),
        );
        expect(onClose).not.toHaveBeenCalled();
        expect(
            screen.getByTestId('v18-unsaved-communication-warning'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Wróć do edycji' }));
        expect(
            screen.queryByTestId('v18-unsaved-communication-warning'),
        ).not.toBeInTheDocument();
        fireEvent.click(
            screen.getByRole('button', { name: 'Symuluj zamknięcie tła' }),
        );
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(
            screen.getByRole('button', { name: 'Odrzuć niezapisane zmiany' }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes normally when preferences have no unsaved modifications', () => {
        const onClose = jest.fn();
        render(
            <V18EditCustomerModal
                open
                customerId={20}
                initialTab="communication"
                onClose={onClose}
                onSuccess={jest.fn()}
                onDeleted={jest.fn()}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zmień preferencję testową' }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Przywróć preferencję testową',
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij edycję klienta' }),
        );
        expect(
            screen.queryByTestId('v18-unsaved-communication-warning'),
        ).not.toBeInTheDocument();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
    it('does not close after saving personal data while communication edits are pending', async () => {
        const onClose = jest.fn();
        const onSuccess = jest.fn();
        render(
            <V18EditCustomerModal
                open
                customerId={20}
                initialTab="communication"
                onClose={onClose}
                onSuccess={onSuccess}
                onDeleted={jest.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Zmień preferencję testową' }),
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Dane klienta' }));
        fireEvent.click(
            screen.getByRole('button', { name: 'Zapisz testowe dane klienta' }),
        );
        await waitFor(() =>
            expect(
                screen.getByText(
                    /Dane klienta zapisane. Masz jeszcze niezapisane ustawienia komunikacji/,
                ),
            ).toBeInTheDocument(),
        );
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('tab', { name: 'Komunikacja' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });

});

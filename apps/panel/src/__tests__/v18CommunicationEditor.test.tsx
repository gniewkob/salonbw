import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import V18EditCustomerModal from '@/components/v18/V18EditCustomerModal';
import {
    useCustomer,
    useDeleteCustomer,
    useUpdateCustomer,
} from '@/hooks/useCustomers';

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ role: 'admin' }),
}));
jest.mock('@/hooks/useCustomers', () => ({
    useCustomer: jest.fn(),
    useUpdateCustomer: jest.fn(),
    useDeleteCustomer: jest.fn(),
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
        children: ReactNode;
    }) =>
        open ? (
            <div role="dialog" aria-label="Edycja klienta">
                <button type="button" onClick={onClose}>
                    Zamknij tło modalu
                </button>
                {children}
            </div>
        ) : null,
}));
jest.mock('@/components/customers/CustomerPersonalDataTab', () => ({
    __esModule: true,
    default: () => <div>Dane osobowe</div>,
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
                    Zmień preferencję
                </button>
                <button type="button" onClick={() => onDirtyChange?.(false)}>
                    Zapisano preferencję
                </button>
            </div>
        ),
    }),
);

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useCustomer).mockReturnValue({
        data: { id: 20, name: 'Klient testowy', fullName: 'Klient testowy' },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
    } as unknown as ReturnType<typeof useCustomer>);
    jest.mocked(useUpdateCustomer).mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({}),
        isPending: false,
    } as unknown as ReturnType<typeof useUpdateCustomer>);
    jest.mocked(useDeleteCustomer).mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue({}),
        isPending: false,
    } as unknown as ReturnType<typeof useDeleteCustomer>);
});

describe('V18 customer communication editor draft guard', () => {
    it('warns before discarding unsaved communication settings', () => {
        const onClose = jest.fn();
        render(
            <V18EditCustomerModal
                open
                initialTab="communication"
                customerId={20}
                onClose={onClose}
                onSuccess={jest.fn()}
                onDeleted={jest.fn()}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zmień preferencję' }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij edycję klienta' }),
        );
        expect(onClose).not.toHaveBeenCalled();
        expect(
            screen.getByText('Niezapisane ustawienia komunikacji'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Wróć do edycji' }));
        expect(onClose).not.toHaveBeenCalled();
        expect(
            screen.queryByText('Niezapisane ustawienia komunikacji'),
        ).toBeNull();

        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij tło modalu' }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij bez zapisywania' }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes directly after preferences have been saved', () => {
        const onClose = jest.fn();
        render(
            <V18EditCustomerModal
                open
                initialTab="communication"
                customerId={20}
                onClose={onClose}
                onSuccess={jest.fn()}
                onDeleted={jest.fn()}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zmień preferencję' }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zapisano preferencję' }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij edycję klienta' }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByText('Niezapisane ustawienia komunikacji'),
        ).toBeNull();
    });
});

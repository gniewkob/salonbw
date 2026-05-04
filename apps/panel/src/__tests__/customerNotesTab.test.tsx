import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CustomerNotesTab from '@/components/customers/CustomerNotesTab';

const createMutateAsyncMock = jest.fn();

jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerNotes: () => ({
        data: [],
        isLoading: false,
        error: null,
    }),
    useCreateCustomerNote: () => ({
        mutateAsync: createMutateAsyncMock,
        isPending: false,
    }),
    useUpdateCustomerNote: () => ({
        mutateAsync: jest.fn(),
    }),
    useDeleteCustomerNote: () => ({
        mutateAsync: jest.fn(),
    }),
}));

describe('CustomerNotesTab', () => {
    beforeEach(() => {
        createMutateAsyncMock.mockReset();
        createMutateAsyncMock.mockResolvedValue({ id: 1 });
    });

    it('creates note with selected type and pin flag', async () => {
        render(<CustomerNotesTab customerId={123} />);

        fireEvent.change(
            screen.getByPlaceholderText('Dodaj komentarz klienta...'),
            {
                target: { value: 'Alergia na lateks' },
            },
        );

        fireEvent.change(screen.getByLabelText('Typ notatki'), {
            target: { value: 'medical' },
        });

        fireEvent.click(screen.getByLabelText('Pokaż w alertach recepcji'));
        fireEvent.click(
            screen.getByRole('button', { name: 'dodaj komentarz' }),
        );

        await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalled());

        expect(createMutateAsyncMock).toHaveBeenCalledWith({
            customerId: 123,
            content: 'Alergia na lateks',
            type: 'medical',
            isPinned: true,
        });
    });

    it('creates general note without pin by default', async () => {
        render(<CustomerNotesTab customerId={123} />);

        fireEvent.change(
            screen.getByPlaceholderText('Dodaj komentarz klienta...'),
            {
                target: { value: 'Lubi poranne terminy' },
            },
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'dodaj komentarz' }),
        );

        await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalled());

        expect(createMutateAsyncMock).toHaveBeenCalledWith({
            customerId: 123,
            content: 'Lubi poranne terminy',
            type: 'general',
            isPinned: false,
        });
    });
});

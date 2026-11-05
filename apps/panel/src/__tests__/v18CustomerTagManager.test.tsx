import React from 'react';
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import {
    useAssignTags,
    useCreateCustomerTag,
    useCustomerTags,
    useRemoveTag,
    useTagsForCustomer,
} from '@/hooks/useCustomers';
import V18CustomerTagManager from '@/components/v18/V18CustomerTagManager';

jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({
        open,
        children,
    }: {
        open: boolean;
        children: React.ReactNode;
    }) => (open ? <div role="dialog">{children}</div> : null),
}));
jest.mock('@/hooks/useCustomers', () => ({
    useCustomerTags: jest.fn(),
    useTagsForCustomer: jest.fn(),
    useAssignTags: jest.fn(),
    useRemoveTag: jest.fn(),
    useCreateCustomerTag: jest.fn(),
}));

const assigned = [{ id: 7, name: 'VIP' }];
const available = [
    { id: 7, name: 'VIP' },
    { id: 9, name: 'Koloryzacja' },
];

function configure() {
    const add = jest.fn().mockResolvedValue(undefined);
    const remove = jest.fn().mockResolvedValue(undefined);
    const create = jest.fn().mockResolvedValue({ id: 11, name: 'Zabieg' });
    jest.mocked(useCustomerTags).mockReturnValue({
        data: available,
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useCustomerTags>);
    jest.mocked(useTagsForCustomer).mockReturnValue({
        data: assigned,
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
    } as unknown as ReturnType<typeof useTagsForCustomer>);
    jest.mocked(useAssignTags).mockReturnValue({
        isPending: false,
        mutateAsync: add,
    } as unknown as ReturnType<typeof useAssignTags>);
    jest.mocked(useRemoveTag).mockReturnValue({
        isPending: false,
        mutateAsync: remove,
    } as unknown as ReturnType<typeof useRemoveTag>);
    jest.mocked(useCreateCustomerTag).mockReturnValue({
        isPending: false,
        mutateAsync: create,
    } as unknown as ReturnType<typeof useCreateCustomerTag>);
    return { add, remove, create };
}

describe('V18 customer tag management', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('loads one customer and adds or removes only its specific tag', async () => {
        const { add, remove } = configure();
        const onChanged = jest.fn();
        render(
            <V18CustomerTagManager
                customerId={101}
                customerName="Klient testowy"
                onClose={jest.fn()}
                onChanged={onChanged}
            />,
        );
        expect(useTagsForCustomer).toHaveBeenCalledWith(101);
        expect(screen.getByText('Klient testowy')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Przypisz tag Koloryzacja',
                }),
            );
        });
        expect(add).toHaveBeenCalledWith({ customerId: 101, tagIds: [9] });
        expect(onChanged).toHaveBeenCalledTimes(1);
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Usuń tag VIP od klienta',
                }),
            );
        });
        expect(remove).toHaveBeenCalledWith({ customerId: 101, tagId: 7 });
        expect(onChanged).toHaveBeenCalledTimes(2);
    });

    it('creates a tag and assigns it to the selected customer', async () => {
        const { create, add } = configure();
        const onChanged = jest.fn();
        render(
            <V18CustomerTagManager
                customerId={101}
                customerName="Klient testowy"
                onClose={jest.fn()}
                onChanged={onChanged}
            />,
        );
        fireEvent.change(screen.getByLabelText('Nowy tag dla tego klienta'), {
            target: { value: '  Zabieg  ' },
        });
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Utwórz i przypisz' }),
            );
        });
        expect(create).toHaveBeenCalledWith({ name: 'Zabieg' });
        expect(add).toHaveBeenCalledWith({ customerId: 101, tagIds: [11] });
        expect(create.mock.invocationCallOrder[0]).toBeLessThan(
            add.mock.invocationCallOrder[0],
        );
        expect(onChanged).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('status')).toHaveTextContent(
            'Tag „Zabieg” utworzony i przypisany klientowi.',
        );
        expect(
            screen.getByLabelText('Nowy tag dla tego klienta'),
        ).toHaveValue('');
    });

    it('reports partial success when creation works but assignment fails', async () => {
        const { create, add } = configure();
        const onChanged = jest.fn();
        add.mockRejectedValueOnce(new Error('synthetic assignment error'));
        render(
            <V18CustomerTagManager
                customerId={101}
                customerName="Klient testowy"
                onClose={jest.fn()}
                onChanged={onChanged}
            />,
        );
        fireEvent.change(screen.getByLabelText('Nowy tag dla tego klienta'), {
            target: { value: 'Zabieg' },
        });
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Utwórz i przypisz' }),
            );
        });
        expect(create).toHaveBeenCalledTimes(1);
        expect(add).toHaveBeenCalledWith({ customerId: 101, tagIds: [11] });
        expect(onChanged).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent(
            'został utworzony, ale nie udało się go przypisać',
        );
        expect(
            screen.getByLabelText('Nowy tag dla tego klienta'),
        ).toHaveValue('');
    });

    it('rejects an existing tag name and permits closing', () => {
        const { create } = configure();
        const onClose = jest.fn();
        render(
            <V18CustomerTagManager
                customerId={101}
                customerName="Klient testowy"
                onClose={onClose}
            />,
        );
        fireEvent.change(screen.getByLabelText('Nowy tag dla tego klienta'), {
            target: { value: 'vip' },
        });
        expect(
            screen.getByRole('button', { name: 'Utwórz i przypisz' }),
        ).toBeDisabled();
        expect(create).not.toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole('button', { name: 'Zamknij zarządzanie tagami' }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('blocks writes on an API read error', () => {
        const { add, remove, create } = configure();
        jest.mocked(useTagsForCustomer).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            refetch: jest.fn(),
        } as unknown as ReturnType<typeof useTagsForCustomer>);
        render(
            <V18CustomerTagManager
                customerId={101}
                customerName="Klient testowy"
                onClose={jest.fn()}
            />,
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nie udało się pobrać tagów',
        );
        expect(
            screen.getByRole('button', { name: 'Przypisz tag Koloryzacja' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Utwórz i przypisz' }),
        ).toBeDisabled();
        expect(add).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
    });
});

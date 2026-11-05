import { act, fireEvent, render, screen } from '@testing-library/react';
import V18CustomerGroupsManager from '@/components/v18/V18CustomerGroupsManager';
import {
    useCreateCustomerGroup,
    useCustomerGroups,
    useUpdateCustomerGroup,
} from '@/hooks/useCustomers';

jest.mock('@/components/Modal', () => ({
    __esModule: true,
    default: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
        open ? <div role="dialog">{children}</div> : null,
}));
jest.mock('@/hooks/useCustomers', () => ({
    useCustomerGroups: jest.fn(),
    useCreateCustomerGroup: jest.fn(),
    useUpdateCustomerGroup: jest.fn(),
}));

const groups = [
    {
        id: 7,
        name: 'VIP',
        description: 'Stałe klientki',
        color: '#67538a',
        parentId: null,
        discountPercent: 15,
        memberCount: 2,
    },
    {
        id: 8,
        name: 'Podgrupa VIP',
        parentId: 7,
        memberCount: 1,
    },
];

function configure() {
    const create = jest.fn().mockResolvedValue({ id: 18, name: 'Nowa grupa' });
    const update = jest.fn().mockResolvedValue({ id: 7, name: 'VIP' });
    const refetch = jest.fn();
    jest.mocked(useCustomerGroups).mockReturnValue({
        data: groups,
        isLoading: false,
        isError: false,
        refetch,
    } as unknown as ReturnType<typeof useCustomerGroups>);
    jest.mocked(useCreateCustomerGroup).mockReturnValue({
        mutateAsync: create,
        isPending: false,
    } as unknown as ReturnType<typeof useCreateCustomerGroup>);
    jest.mocked(useUpdateCustomerGroup).mockReturnValue({
        mutateAsync: update,
        isPending: false,
    } as unknown as ReturnType<typeof useUpdateCustomerGroup>);
    return { create, update, refetch };
}

describe('V18 customer group manager', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('creates a group with explicit page-only selected member IDs', async () => {
        const { create } = configure();
        const onChanged = jest.fn();
        render(
            <V18CustomerGroupsManager
                selectedCustomerIds={[101]}
                onChanged={onChanged}
                onClose={jest.fn()}
            />,
        );
        fireEvent.change(screen.getByLabelText('Nazwa grupy'), {
            target: { value: '  Nowa grupa  ' },
        });
        fireEvent.change(screen.getByLabelText('Grupa nadrzędna'), {
            target: { value: '7' },
        });
        fireEvent.change(screen.getByLabelText('Stały rabat (%)'), {
            target: { value: '10' },
        });
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /Przypisz zaznaczonych klientów z bieżącej strony/,
            }),
        );
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Utwórz grupę' }),
            );
        });
        expect(create).toHaveBeenCalledWith({
            name: 'Nowa grupa',
            description: '',
            color: '#67538a',
            parentId: 7,
            discountPercent: 10,
            memberIds: [101],
        });
        expect(onChanged).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('status')).toHaveTextContent(
            'Grupa została utworzona.',
        );
    });

    it('does not include members unless the checkbox is explicitly checked', async () => {
        const { create } = configure();
        render(
            <V18CustomerGroupsManager
                selectedCustomerIds={[101]}
                onChanged={jest.fn()}
                onClose={jest.fn()}
            />,
        );
        fireEvent.change(screen.getByLabelText('Nazwa grupy'), {
            target: { value: 'Zabiegi' },
        });
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Utwórz grupę' }),
            );
        });
        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({ memberIds: undefined }),
        );
    });

    it('edits hierarchy, name and standing discount without replacing membership', async () => {
        const { update } = configure();
        render(
            <V18CustomerGroupsManager
                selectedCustomerIds={[]}
                onChanged={jest.fn()}
                onClose={jest.fn()}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Edytuj grupę VIP' }));
        const parent = screen.getByLabelText(
            'Grupa nadrzędna',
        ) as HTMLSelectElement;
        expect(
            Array.from(parent.options).some((option) => option.value === '8'),
        ).toBe(false);
        expect(
            Array.from(parent.options).some((option) => option.value === '7'),
        ).toBe(false);
        fireEvent.change(screen.getByLabelText('Nazwa grupy'), {
            target: { value: 'VIP Premium' },
        });
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Zapisz grupę' }),
            );
        });
        expect(update).toHaveBeenCalledWith({
            id: 7,
            data: {
                name: 'VIP Premium',
                description: 'Stałe klientki',
                color: '#67538a',
                parentId: null,
                discountPercent: 15,
            },
        });
    });

    it('rejects duplicated names and invalid discounts without sending writes', () => {
        const { create } = configure();
        render(
            <V18CustomerGroupsManager
                selectedCustomerIds={[]}
                onChanged={jest.fn()}
                onClose={jest.fn()}
            />,
        );
        fireEvent.change(screen.getByLabelText('Nazwa grupy'), {
            target: { value: 'vip' },
        });
        expect(screen.getByRole('button', { name: 'Utwórz grupę' })).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Nazwa grupy'), {
            target: { value: 'Nowa grupa' },
        });
        fireEvent.change(screen.getByLabelText('Stały rabat (%)'), {
            target: { value: '150' },
        });
        expect(screen.getByRole('button', { name: 'Utwórz grupę' })).toBeDisabled();
        expect(create).not.toHaveBeenCalled();
    });

    it('does not permit writes when the group catalog fails to load', () => {
        const { create } = configure();
        jest.mocked(useCustomerGroups).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            refetch: jest.fn(),
        } as unknown as ReturnType<typeof useCustomerGroups>);
        render(
            <V18CustomerGroupsManager
                selectedCustomerIds={[]}
                onChanged={jest.fn()}
                onClose={jest.fn()}
            />,
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nie udało się pobrać grup.',
        );
        expect(screen.getByRole('button', { name: 'Utwórz grupę' })).toBeDisabled();
        expect(create).not.toHaveBeenCalled();
    });
});

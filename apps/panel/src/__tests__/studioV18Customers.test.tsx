import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import {
    useAddGroupMembers,
    useCustomerGroups,
    useCustomerTags,
    useCustomers,
} from '@/hooks/useCustomers';
import NewCustomerModal from '@/components/customers/NewCustomerModal';
import V18EditCustomerModal from '@/components/v18/V18EditCustomerModal';
import {
    V18CustomersPilot,
    getServerSideProps,
} from '@/pages/studio-v18/customers';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@/hooks/useCustomers', () => ({
    useCustomers: jest.fn(),
    useCustomerGroups: jest.fn(),
    useCustomerTags: jest.fn(),
    useAddGroupMembers: jest.fn(),
}));
jest.mock('@/components/customers/NewCustomerModal', () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) =>
        open ? <div data-testid="new-customer-modal">Nowy klient</div> : null,
}));
jest.mock('@/components/v18/V18CustomerGroupsManager', () => ({
    __esModule: true,
    default: ({
        selectedCustomerIds,
        onChanged,
    }: {
        selectedCustomerIds: number[];
        onChanged: () => void;
    }) => (
        <div data-testid="v18-group-manager">
            <span>{selectedCustomerIds.join(',')}</span>
            <button type="button" onClick={onChanged}>
                Zapisz testowo grupę
            </button>
        </div>
    ),
}));
jest.mock('@/components/v18/V18CustomerTagManager', () => ({
    __esModule: true,
    default: ({ customerName }: { customerName: string }) => (
        <div data-testid="v18-tag-manager">{customerName}</div>
    ),
}));
jest.mock('@/components/v18/V18EditCustomerModal', () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) =>
        open ? (
            <div data-testid="edit-customer-modal">Edycja klienta</div>
        ) : null,
}));

const customers = {
    items: [
        {
            id: 101,
            name: 'Testowa Osoba',
            email: 'test@example.invalid',
            smsConsent: false,
            emailConsent: false,
            gdprConsent: false,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
};

function setSuccessMocks() {
    jest.mocked(useRouter).mockReturnValue({
        push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    jest.mocked(useAddGroupMembers).mockReturnValue({
        mutateAsync: jest.fn().mockResolvedValue(undefined),
        isPending: false,
    } as unknown as ReturnType<typeof useAddGroupMembers>);
    jest.mocked(useCustomers).mockReturnValue({
        data: customers,
        isLoading: false,
        isFetching: false,
        isError: false,
        isPlaceholderData: false,
        refetch: jest.fn(),
    } as unknown as ReturnType<typeof useCustomers>);
    jest.mocked(useCustomerGroups).mockReturnValue({
        data: [{ id: 7, name: 'VIP' }],
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useCustomerGroups>);
    jest.mocked(useCustomerTags).mockReturnValue({
        data: [{ id: 9, name: 'Koloryzacja' }],
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useCustomerTags>);
}

describe('V18 Customers live DEV pilot', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        setSuccessMocks();
    });

    it('renders API-backed customer data with real booking and edit controls', () => {
        render(<V18CustomersPilot />);
        expect(
            screen.getByRole('heading', { name: 'Klienci V18' }),
        ).toBeInTheDocument();

        const table = screen.getByRole('table');
        expect(within(table).getByText('Testowa Osoba')).toBeInTheDocument();
        expect(
            within(table).getByRole('link', { name: 'Umów' }),
        ).toHaveAttribute(
            'href',
            '/calendar?newClient=101&clientName=Testowa%20Osoba',
        );
        expect(
            screen.getByRole('link', { name: 'Pełny moduł Klienci' }),
        ).toHaveAttribute('href', '/customers');

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edytuj klienta: Testowa Osoba',
            }),
        );
        expect(screen.getByTestId('edit-customer-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Dodaj klienta' }));
        expect(screen.getByTestId('new-customer-modal')).toBeInTheDocument();
        expect(NewCustomerModal).toBeDefined();
        expect(V18EditCustomerModal).toBeDefined();
    });

    it('opens tag management for the correct customer without touching other records', () => {
        render(<V18CustomersPilot />);
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Zarządzaj tagami klienta: Testowa Osoba',
            }),
        );
        expect(screen.getByTestId('v18-tag-manager')).toHaveTextContent(
            'Testowa Osoba',
        );
    });

    it('opens the group manager with only selected visible customers', () => {
        const refetch = jest.fn();
        jest.mocked(useCustomers).mockReturnValue({
            data: customers,
            isLoading: false,
            isFetching: false,
            isError: false,
            isPlaceholderData: false,
            refetch,
        } as unknown as ReturnType<typeof useCustomers>);
        render(<V18CustomersPilot />);
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Zaznacz klientów na stronie',
            }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Nowa grupa z zaznaczonych',
            }),
        );
        expect(screen.getByTestId('v18-group-manager')).toHaveTextContent(
            '101',
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zapisz testowo grupę' }),
        );
        expect(refetch).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/Zaznaczono: 1 z/)).not.toBeInTheDocument();
    });

    it('opens group management without a customer selection', () => {
        render(<V18CustomersPilot />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Zarządzaj grupami' }),
        );
        expect(screen.getByTestId('v18-group-manager')).toBeInTheDocument();
        expect(screen.getByTestId('v18-group-manager')).not.toHaveTextContent(
            '101',
        );
    });

    it('passes group filtering and sorting to existing server API hook', () => {
        render(<V18CustomersPilot />);
        fireEvent.change(screen.getByLabelText('Grupa klientów'), {
            target: { value: '7' },
        });
        expect(useCustomers).toHaveBeenLastCalledWith(
            expect.objectContaining({ groupId: 7, page: 1 }),
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Sortuj po e-mailu' }),
        );
        expect(useCustomers).toHaveBeenLastCalledWith(
            expect.objectContaining({
                groupId: 7,
                sortBy: 'email',
                sortOrder: 'ASC',
            }),
        );
    });

    it('uses the existing customer API for tag and quick filtering', () => {
        render(<V18CustomersPilot />);
        fireEvent.change(screen.getByLabelText('Tag klienta'), {
            target: { value: '9' },
        });
        expect(useCustomers).toHaveBeenLastCalledWith(
            expect.objectContaining({ tagId: 9, page: 1 }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Brak zgody SMS' }));
        expect(useCustomers).toHaveBeenLastCalledWith(
            expect.objectContaining({ tagId: 9, smsConsent: false }),
        );
        expect(
            screen.getByRole('button', { name: 'Brak zgody SMS' }),
        ).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));
        expect(useCustomers).toHaveBeenLastCalledWith(
            expect.objectContaining({
                tagId: undefined,
                smsConsent: undefined,
            }),
        );
        expect(
            screen.getByRole('button', { name: 'Brak zgody SMS' }),
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('clears bulk selection when the tag or quick filter changes', () => {
        render(<V18CustomersPilot />);
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Zaznacz klientów na stronie',
            }),
        );
        expect(screen.getByText(/Zaznaczono: 1 z/)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Tag klienta'), {
            target: { value: '9' },
        });
        expect(screen.queryByText(/Zaznaczono: 1 z/)).toBeNull();
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Zaznacz klientów na stronie',
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Nadchodząca wizyta' }),
        );
        expect(screen.queryByText(/Zaznaczono: 1 z/)).toBeNull();
    });

    it('selects only the visible page and assigns existing group members', async () => {
        const mutateAsync = jest.fn().mockResolvedValue(undefined);
        jest.mocked(useAddGroupMembers).mockReturnValue({
            mutateAsync,
            isPending: false,
        } as unknown as ReturnType<typeof useAddGroupMembers>);
        render(<V18CustomersPilot />);
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Zaznacz klientów na stronie',
            }),
        );
        expect(screen.getByText(/Zaznaczono: 1 z/)).toBeInTheDocument();
        fireEvent.change(
            screen.getByLabelText('Wybierz grupę do przypisania'),
            { target: { value: '7' } },
        );
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Dodaj do grupy' }),
            );
        });
        expect(mutateAsync).toHaveBeenCalledWith({
            groupId: 7,
            customerIds: [101],
        });
        expect(screen.queryByText(/Zaznaczono: 1 z/)).not.toBeInTheDocument();
    });

    it('clears selection when server query changes', () => {
        render(<V18CustomersPilot />);
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: 'Zaznacz klienta: Testowa Osoba',
            }),
        );
        expect(screen.getByText(/Zaznaczono: 1 z/)).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole('button', { name: 'Sortuj po e-mailu' }),
        );
        expect(screen.queryByText(/Zaznaczono: 1 z/)).not.toBeInTheDocument();
    });

    it('exports only the current page on request', () => {
        const create = jest.fn().mockReturnValue('blob:fixture');
        const revoke = jest.fn();
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: create,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: revoke,
        });
        const click = jest.spyOn(HTMLAnchorElement.prototype, 'click');
        click.mockImplementation(() => undefined);
        try {
            render(<V18CustomersPilot />);
            jest.useFakeTimers();
            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Eksportuj stronę CSV',
                }),
            );
            expect(create).toHaveBeenCalledTimes(1);
            expect(click).toHaveBeenCalledTimes(1);
            act(() => jest.runOnlyPendingTimers());
            expect(revoke).toHaveBeenCalledWith('blob:fixture');
        } finally {
            jest.useRealTimers();
            click.mockRestore();
        }
    });

    it('shows backend errors separately from empty results, with retry', () => {
        const refetch = jest.fn();
        jest.mocked(useCustomers).mockReturnValue({
            data: undefined,
            isLoading: false,
            isFetching: false,
            isError: true,
            isPlaceholderData: false,
            refetch,
        } as unknown as ReturnType<typeof useCustomers>);

        render(<V18CustomersPilot />);
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nie udało się pobrać',
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Spróbuj ponownie' }),
        );
        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('rejects production and other hosts at server-side route gate', async () => {
        const previous = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
        try {
            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
            const ctx = (host: string) =>
                ({
                    req: { headers: { host } },
                }) as unknown as GetServerSidePropsContext;
            expect(await getServerSideProps(ctx('panel.salon-bw.pl'))).toEqual({
                notFound: true,
            });
            expect(
                await getServerSideProps(ctx('dev-panel.salon-bw.pl')),
            ).toEqual({ props: {} });

            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'production';
            expect(
                await getServerSideProps(ctx('dev-panel.salon-bw.pl')),
            ).toEqual({ notFound: true });
        } finally {
            if (previous === undefined) {
                delete process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
            } else {
                process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = previous;
            }
        }
    });
});

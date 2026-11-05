import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import { useCustomerGroups, useCustomers } from '@/hooks/useCustomers';
import NewCustomerModal from '@/components/customers/NewCustomerModal';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import {
    V18CustomersPilot,
    getServerSideProps,
} from '@/pages/studio-v18/customers';

jest.mock('@/hooks/useCustomers', () => ({
    useCustomers: jest.fn(),
    useCustomerGroups: jest.fn(),
}));
jest.mock('@/components/customers/NewCustomerModal', () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) =>
        open ? <div data-testid="new-customer-modal">Nowy klient</div> : null,
}));
jest.mock('@/components/customers/EditCustomerModal', () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) =>
        open ? <div data-testid="edit-customer-modal">Edycja klienta</div> : null,
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
        expect(EditCustomerModal).toBeDefined();
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
        fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
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

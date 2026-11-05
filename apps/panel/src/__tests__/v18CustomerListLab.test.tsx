import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import {
    V18CustomerListLab,
    getServerSideProps,
} from '@/pages/studio-v18/customer-list-lab';
import V18CustomerTable from '@/components/v18/V18CustomerTable';
import { initialV18CustomerQuery } from '@/utils/v18CustomerQuery';

describe('V18 customer list — synthetic isolated preview', () => {
    it('shows real interactions but only synthetic, non-API records', () => {
        render(<V18CustomerListLab />);
        expect(
            screen.getByRole('heading', { name: 'Lista klientów V18' }),
        ).toBeInTheDocument();
        const table = screen.getByRole('table', {
            name: 'Klienci — tabela z sortowaniem serwerowym',
        });
        expect(
            within(table).getByText('Klient testowy 01'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Klient testowy 01' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Umów' }),
        ).not.toBeInTheDocument();
        expect(
            within(table).queryByText('Klient testowy 21'),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/Strona 1 z 4/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Następna' }));
        expect(
            within(table).getByText('Klient testowy 21'),
        ).toBeInTheDocument();
        expect(screen.getByText(/Strona 2 z 4/)).toBeInTheDocument();

        fireEvent.change(
            screen.getByRole('searchbox', { name: 'Wyszukaj klienta' }),
            {
                target: { value: 'testowy 02' },
            },
        );
        expect(
            within(table).getByText('Klient testowy 02'),
        ).toBeInTheDocument();
        expect(screen.getByText(/Strona 1 z 1/)).toBeInTheDocument();
        expect(
            within(table).queryByText('Klient testowy 21'),
        ).not.toBeInTheDocument();
    });

    it('updates aria-sort without re-sorting a server-provided page in the table', () => {
        const onSort = jest.fn();
        const data = {
            items: [
                {
                    id: 1,
                    name: 'Zeta',
                    email: 'z@example.invalid',
                    smsConsent: false,
                    emailConsent: false,
                    gdprConsent: false,
                    createdAt: '2026-01-01T00:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 2,
                    name: 'Alfa',
                    email: 'a@example.invalid',
                    smsConsent: false,
                    emailConsent: false,
                    gdprConsent: false,
                    createdAt: '2026-01-02T00:00:00Z',
                    updatedAt: '2026-01-02T00:00:00Z',
                },
            ],
            total: 21,
            page: 1,
            limit: 20,
            totalPages: 2,
        };
        render(
            <V18CustomerTable
                data={data}
                query={initialV18CustomerQuery}
                onSort={onSort}
                onPageChange={jest.fn()}
            />,
        );
        const table = screen.getByRole('table');
        expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Zeta');
        expect(
            within(table).getByRole('columnheader', {
                name: /Sortuj po nazwie klienta/,
            }),
        ).toHaveAttribute('aria-sort', 'ascending');
        fireEvent.click(
            within(table).getByRole('button', {
                name: 'Sortuj po e-mailu',
            }),
        );
        expect(onSort).toHaveBeenCalledWith('email');
        expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Zeta');
    });

    it('has distinct loading, error and empty states', () => {
        const { rerender } = render(
            <V18CustomerTable
                query={initialV18CustomerQuery}
                loading
                onSort={jest.fn()}
                onPageChange={jest.fn()}
            />,
        );
        expect(screen.getByRole('status')).toHaveTextContent(
            'Ładowanie klientów',
        );

        rerender(
            <V18CustomerTable
                query={initialV18CustomerQuery}
                error
                onSort={jest.fn()}
                onPageChange={jest.fn()}
            />,
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nie udało się pobrać',
        );

        rerender(
            <V18CustomerTable
                query={initialV18CustomerQuery}
                data={{
                    items: [],
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0,
                }}
                onSort={jest.fn()}
                onPageChange={jest.fn()}
            />,
        );
        expect(
            screen.getByText('Brak klientów spełniających kryteria.'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Następna' })).toBeDisabled();
    });

    it('cannot SSR-render on production hosts or non-DEV builds', async () => {
        const old = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
        try {
            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
            expect(
                await getServerSideProps({
                    req: { headers: { host: 'panel.salon-bw.pl' } },
                } as unknown as GetServerSidePropsContext),
            ).toEqual({ notFound: true });
        } finally {
            if (old === undefined)
                delete process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
            else process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = old;
        }
    });
});

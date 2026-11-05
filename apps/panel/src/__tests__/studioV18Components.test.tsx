import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import {
    V18ComponentsCatalog,
    getServerSideProps,
} from '@/pages/studio-v18/components';

describe('Studio V18 component catalog', () => {
    it('shows the V18 component foundation using synthetic examples', () => {
        render(<V18ComponentsCatalog />);

        expect(
            screen.getByRole('heading', {
                name: 'Biblioteka komponentów V18',
            }),
        ).toBeInTheDocument();

        const table = screen.getByRole('table', {
            name: 'Demonstracyjna tabela klientów',
        });
        expect(within(table).getByText('Anna Przykład')).toBeInTheDocument();
        expect(within(table).getByText('Ola Demo')).toBeInTheDocument();
        expect(
            screen.getByText('Dane wyłącznie demonstracyjne'),
        ).toBeInTheDocument();
        expect(screen.getByText('Brak wyników')).toBeInTheDocument();
    });

    it('has a real, keyboard-operable demonstration action with feedback', () => {
        render(<V18ComponentsCatalog />);
        const action = screen.getByRole('button', {
            name: 'Przetestuj działanie',
        });
        expect(action).toBeEnabled();

        fireEvent.click(action);
        expect(
            screen.getByText('Przykładowa akcja wykonana'),
        ).toBeInTheDocument();
    });

    it('is not server-rendered on any non-DEV host', async () => {
        const previous = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
        try {
            process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
            const context = {
                req: { headers: { host: 'salon-bw.pl' } },
            } as unknown as GetServerSidePropsContext;
            expect(await getServerSideProps(context)).toEqual({
                notFound: true,
            });
        } finally {
            if (previous === undefined) {
                delete process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
            } else {
                process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = previous;
            }
        }
    });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers';
import {
    V18CreateCustomer,
    getServerSideProps,
} from '@/pages/studio-v18/customers/new';
import type { GetServerSidePropsContext } from 'next';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(() => ({ role: 'admin' })),
}));
jest.mock('@/hooks/useCustomers', () => ({
    useCreateCustomer: jest.fn(),
    useCustomers: jest.fn(),
}));

const push = jest.fn().mockResolvedValue(true);
const create = jest.fn().mockResolvedValue({
    id: 881,
    firstName: 'Anna',
    lastName: 'Testowa',
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({
        push,
    } as unknown as ReturnType<typeof useRouter>);
    jest.mocked(useCreateCustomer).mockReturnValue({
        mutateAsync: create,
        isPending: false,
    } as unknown as ReturnType<typeof useCreateCustomer>);
    jest.mocked(useCustomers).mockReturnValue({
        data: { items: [] },
        isLoading: false,
    } as unknown as ReturnType<typeof useCustomers>);
});

describe('V18 new customer card', () => {
    it('renders V18 customer creation and navigation', () => {
        render(<V18CreateCustomer />);
        expect(screen.getByTestId('v18-create-customer')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Nowa karta klienta' }),
        ).toBeVisible();
        expect(
            screen.getByRole('link', { name: 'Wróć do klientów' }),
        ).toHaveAttribute('href', '/studio-v18/customers');
        expect(
            screen.getByRole('button', { name: 'Utwórz kartę klienta' }),
        ).toBeDisabled();
        expect(screen.getByLabelText('Imię')).toBeInTheDocument();
    });

    it('creates a customer and opens the V18 card', async () => {
        render(<V18CreateCustomer />);
        fireEvent.change(screen.getByLabelText('Imię'), {
            target: { value: ' Anna ' },
        });
        fireEvent.change(screen.getByLabelText('Nazwisko'), {
            target: { value: ' Testowa ' },
        });
        fireEvent.change(screen.getByLabelText('Telefon'), {
            target: { value: '500600700' },
        });
        fireEvent.change(screen.getByLabelText('Stały rabat (%)'), {
            target: { value: '7.5' },
        });

        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Utwórz kartę klienta' }),
            );
        });

        expect(create).toHaveBeenCalledWith(
            expect.objectContaining({
                firstName: 'Anna',
                lastName: 'Testowa',
                phone: '500600700',
                discountPercent: 7.5,
                emailConsent: false,
                smsConsent: false,
            }),
        );
        expect(push).toHaveBeenCalledWith('/studio-v18/customers/881');
    });

    it('keeps draft after failed CRM creation', async () => {
        create.mockRejectedValueOnce(new Error('CRM niedostępny'));
        render(<V18CreateCustomer />);
        fireEvent.change(screen.getByLabelText('Imię'), {
            target: { value: 'Anna' },
        });

        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Utwórz kartę klienta' }),
            );
        });
        expect(screen.getByRole('alert')).toHaveTextContent('CRM niedostępny');
        expect(screen.getByLabelText('Imię')).toHaveValue('Anna');
        expect(push).not.toHaveBeenCalled();
    });

    it('rejects unsupported hosts on the DEV creation page', async () => {
        const context = {
            req: { headers: { host: 'salon-bw.pl' } },
        } as unknown as GetServerSidePropsContext;
        const result = await getServerSideProps(context);
        expect(result).toEqual({ notFound: true });
    });
});

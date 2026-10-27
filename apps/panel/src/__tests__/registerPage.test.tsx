import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import RegisterPage from '@/pages/auth/register';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const mockPush = jest.fn();
const mockQuery: Record<string, string | string[]> = {};
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        asPath: '/',
        query: mockQuery,
    }),
}));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const GDPR_REQUIRED = 'Zgoda na przetwarzanie danych osobowych jest wymagana';

describe('RegisterPage consents', () => {
    beforeEach(() => {
        mockPush.mockClear();
        for (const key of Object.keys(mockQuery)) delete mockQuery[key];
        mockedUseAuth.mockReturnValue(createAuthValue({}));
    });

    it('does not flag a checked GDPR consent as missing when it loses focus', () => {
        render(<RegisterPage />);

        // A client fills the form first: leaving the password field validates
        // the whole form while GDPR is still unchecked.
        const password = screen.getByLabelText('Hasło');
        fireEvent.change(password, { target: { value: 'Klientka-2026!' } });
        fireEvent.blur(password);

        // ...then ticks GDPR and moves on, which blurs the checkbox.
        const gdpr = screen.getByRole('checkbox', {
            name: /przetwarzanie moich danych osobowych/i,
        });
        fireEvent.click(gdpr);
        fireEvent.blur(gdpr);

        expect(gdpr).toBeChecked();
        // A stale "required" error here would sit between the two consents and
        // push the terms checkbox down mid-click, so the click missed it.
        expect(screen.queryByText(GDPR_REQUIRED)).toBeNull();
    });

    it('still reports a missing GDPR consent once it is touched unchecked', () => {
        render(<RegisterPage />);

        const gdpr = screen.getByRole('checkbox', {
            name: /przetwarzanie moich danych osobowych/i,
        });
        fireEvent.blur(gdpr);

        expect(screen.getByText(GDPR_REQUIRED)).toBeInTheDocument();
    });

    it('clears the GDPR error as soon as the consent is given', () => {
        render(<RegisterPage />);

        const gdpr = screen.getByRole('checkbox', {
            name: /przetwarzanie moich danych osobowych/i,
        });
        fireEvent.blur(gdpr);
        expect(screen.getByText(GDPR_REQUIRED)).toBeInTheDocument();

        fireEvent.click(gdpr);

        expect(screen.queryByText(GDPR_REQUIRED)).toBeNull();
    });

    it('sends an already-registered client to set her password', async () => {
        const register = jest
            .fn()
            .mockRejectedValue(
                new Error(
                    'Konto z tym adresem e-mail już istnieje. Jeśli to Twój adres, ustaw hasło przez „Nie pamiętasz hasła?”.',
                ),
            );
        mockedUseAuth.mockReturnValue(createAuthValue({ register }));
        render(<RegisterPage />);

        fireEvent.change(screen.getByLabelText('Imię i nazwisko'), {
            target: { value: 'Barbara Historyczna' },
        });
        fireEvent.change(screen.getByLabelText('Adres e-mail'), {
            target: { value: 'barbara@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Hasło'), {
            target: { value: 'plainPass' },
        });
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /przetwarzanie moich danych/i,
            }),
        );
        fireEvent.click(screen.getByRole('checkbox', { name: /Regulamin/i }));
        fireEvent.click(
            screen.getByRole('button', { name: 'Zarejestruj się' }),
        );

        const link = await screen.findByRole('link', { name: /Ustaw hasło/ });
        expect(link).toHaveAttribute(
            'href',
            '/auth/forgot-password?email=barbara%40example.com',
        );
        await waitFor(() => expect(register).toHaveBeenCalled());
    });
    it.each([
        '/booking?serviceId=42',
        '/booking',
        'https://outside.invalid/booking',
        '//outside.invalid/booking',
    ])('returns safely after registration: %s', async (target) => {
        mockQuery.redirectTo = target;
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                register: jest.fn().mockResolvedValue(undefined),
                apiFetch: jest.fn().mockResolvedValue({ role: 'client' }),
            }),
        );
        render(<RegisterPage />);
        expect(
            screen.getByRole('link', { name: 'Zaloguj się' }),
        ).toHaveAttribute(
            'href',
            target.startsWith('/booking')
                ? `/auth/login?redirectTo=${encodeURIComponent(target)}`
                : '/auth/login',
        );
        fireEvent.change(screen.getByLabelText('Imię i nazwisko'), {
            target: { value: 'UAT Client' },
        });
        fireEvent.change(screen.getByLabelText('Adres e-mail'), {
            target: { value: 'uat@example.invalid' },
        });
        fireEvent.change(screen.getByLabelText('Hasło'), {
            target: { value: 'Uat-Password-2026!' },
        });
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /przetwarzanie moich danych/i,
            }),
        );
        fireEvent.click(screen.getByRole('checkbox', { name: /Regulamin/i }));
        fireEvent.click(
            screen.getByRole('button', { name: 'Zarejestruj się' }),
        );
        await waitFor(() =>
            expect(mockPush).toHaveBeenCalledWith(
                target.startsWith('/booking') ? target : '/dashboard',
            ),
        );
    });
});

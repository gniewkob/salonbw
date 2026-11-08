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

function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText('Imię i nazwisko'), {
        target: { value: 'UAT Client' },
    });
    fireEvent.change(screen.getByLabelText('Adres e-mail'), {
        target: { value: 'uat@example.invalid' },
    });
    fireEvent.change(screen.getByLabelText('Hasło'), {
        target: { value: 'Uat-Password-2026!' },
    });
}

describe('RegisterPage — privacy notice, terms and one marketing choice', () => {
    beforeEach(() => {
        mockPush.mockClear();
        for (const key of Object.keys(mockQuery)) delete mockQuery[key];
        mockedUseAuth.mockReturnValue(createAuthValue({}));
    });

    it('shows a privacy notice without a mandatory GDPR consent checkbox', () => {
        render(<RegisterPage />);
        expect(
            screen.getByRole('link', { name: /Polityce prywatności/i }),
        ).toHaveAttribute('href', expect.stringContaining('/privacy'));
        expect(
            screen.queryByRole('checkbox', { name: /przetwarzanie moich danych/i }),
        ).not.toBeInTheDocument();
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });

    it('requires terms but leaves marketing optional and all channels off by default', async () => {
        const register = jest.fn().mockResolvedValue(undefined);
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                register,
                apiFetch: jest.fn().mockResolvedValue({ role: 'client' }),
            }),
        );
        render(<RegisterPage />);
        fillRequiredFields();
        fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
        expect(
            screen.getByText('Akceptacja regulaminu jest wymagana'),
        ).toBeInTheDocument();
        expect(register).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('checkbox', { name: /Regulamin/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
        await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
        expect(register).toHaveBeenCalledWith(
            expect.objectContaining({
                termsConsent: true,
                marketingConsent: false,
                smsConsent: false,
                whatsappConsent: false,
                emailConsent: false,
            }),
        );
        expect(register.mock.calls[0][0]).not.toHaveProperty('gdprConsent');
    });

    it('one optional marketing checkbox explicitly opts into all three named channels', async () => {
        const register = jest.fn().mockResolvedValue(undefined);
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                register,
                apiFetch: jest.fn().mockResolvedValue({ role: 'client' }),
            }),
        );
        render(<RegisterPage />);
        fillRequiredFields();
        fireEvent.click(screen.getByRole('checkbox', { name: /Regulamin/i }));
        fireEvent.click(
            screen.getByRole('checkbox', { name: /oferty i promocje/i }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
        await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
        expect(register).toHaveBeenCalledWith(
            expect.objectContaining({
                marketingConsent: true,
                smsConsent: true,
                whatsappConsent: true,
                emailConsent: true,
            }),
        );
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
        fillRequiredFields();
        fireEvent.click(screen.getByRole('checkbox', { name: /Regulamin/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));

        const link = await screen.findByRole('link', { name: /Ustaw hasło/ });
        expect(link).toHaveAttribute(
            'href',
            '/auth/forgot-password?email=uat%40example.invalid',
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
        fillRequiredFields();
        fireEvent.click(screen.getByRole('checkbox', { name: /Regulamin/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Zarejestruj się' }));
        await waitFor(() =>
            expect(mockPush).toHaveBeenCalledWith(
                target.startsWith('/booking') ? target : '/dashboard',
            ),
        );
    });
});

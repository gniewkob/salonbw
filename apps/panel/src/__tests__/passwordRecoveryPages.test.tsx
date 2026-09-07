import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '@/pages/auth/forgot-password';
import ResetPasswordPage from '@/pages/auth/reset-password';
import { requestPasswordReset, resetPassword } from '@/api/auth';

jest.mock('@/api/auth', () => ({
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
}));

const requestMock = jest.mocked(requestPasswordReset);
const resetMock = jest.mocked(resetPassword);

describe('password recovery pages', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.history.replaceState({}, '', '/auth/reset-password');
    });

    it('submits an email and always shows the neutral confirmation', async () => {
        requestMock.mockResolvedValue({
            message:
                'Jeśli konto istnieje, wysłaliśmy wiadomość z dalszymi instrukcjami.',
        });
        render(<ForgotPasswordPage />);

        fireEvent.change(screen.getByLabelText(/adres e-mail/i), {
            target: { value: 'client@example.com' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: /wyślij instrukcje/i }),
        );

        await waitFor(() =>
            expect(requestMock).toHaveBeenCalledWith('client@example.com'),
        );
        expect(
            await screen.findByText(/jeśli konto istnieje/i),
        ).toBeInTheDocument();
    });

    it('requires matching passwords and submits the link token', async () => {
        window.history.replaceState(
            {},
            '',
            '/auth/reset-password?token=one-time-token',
        );
        resetMock.mockResolvedValue({ message: 'Hasło zostało zmienione.' });
        render(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText('Nowe hasło'), {
            target: { value: 'NewPassword8' },
        });
        fireEvent.change(screen.getByLabelText('Powtórz nowe hasło'), {
            target: { value: 'NewPassword8' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

        await waitFor(() =>
            expect(resetMock).toHaveBeenCalledWith(
                'one-time-token',
                'NewPassword8',
            ),
        );
        await waitFor(() => expect(window.location.search).toBe(''));
        expect(
            await screen.findByText(/hasło zostało zmienione/i),
        ).toBeVisible();
        expect(
            screen.getByRole('link', { name: /zaloguj się/i }),
        ).toHaveAttribute('href', '/auth/login');
    });

    it('reads a reset token from the URL fragment', async () => {
        window.location.hash = 'token=fragment-token';
        resetMock.mockResolvedValue({ message: 'Hasło zostało zmienione.' });
        render(<ResetPasswordPage />);

        fireEvent.change(screen.getByLabelText('Nowe hasło'), {
            target: { value: 'NewPassword8' },
        });
        fireEvent.change(screen.getByLabelText('Powtórz nowe hasło'), {
            target: { value: 'NewPassword8' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ustaw hasło/i }));

        await waitFor(() =>
            expect(resetMock).toHaveBeenCalledWith(
                'fragment-token',
                'NewPassword8',
            ),
        );
        await waitFor(() => expect(window.location.hash).toBe(''));
    });
});

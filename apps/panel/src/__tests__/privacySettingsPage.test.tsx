import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import PrivacySettingsPage from '@/pages/settings/privacy';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('PrivacySettingsPage', () => {
    it('shows load error and retry when profile fetch fails', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('network'));

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<PrivacySettingsPage />);

        expect(
            await screen.findByText(/Nie udało się załadować aktualnych zgód/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Spróbuj ponownie' }),
        ).toBeInTheDocument();
    });

    it('does not call consent PATCH while load error is active', async () => {
        const apiFetch = jest.fn().mockRejectedValue(new Error('network'));

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<PrivacySettingsPage />);

        await screen.findByText(/Nie udało się załadować aktualnych zgód/i);

        expect(
            screen.queryByRole('button', { name: 'Zapisz ustawienia' }),
        ).not.toBeInTheDocument();

        expect(
            apiFetch.mock.calls.some(
                ([path, init]) =>
                    path === '/users/profile/consent' &&
                    (init as { method?: string } | undefined)?.method ===
                        'PATCH',
            ),
        ).toBe(false);
    });

    it('allows save after successful retry', async () => {
        const apiFetch = jest
            .fn()
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce({
                id: 1,
                role: 'client',
                gdprConsent: true,
                smsConsent: false,
                emailConsent: false,
                gdprConsentDate: '2026-05-01T00:00:00.000Z',
            })
            .mockResolvedValueOnce({ smsConsent: true, emailConsent: false });

        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );

        render(<PrivacySettingsPage />);

        const retryButton = await screen.findByRole('button', {
            name: 'Spróbuj ponownie',
        });
        fireEvent.click(retryButton);

        const saveButton = await screen.findByRole('button', {
            name: 'Zapisz ustawienia',
        });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(
                apiFetch.mock.calls.some(
                    ([path, init]) =>
                        path === '/users/profile/consent' &&
                        (init as { method?: string } | undefined)?.method ===
                            'PATCH',
                ),
            ).toBe(true);
        });

        expect(
            await screen.findByText('Ustawienia zostały zapisane.'),
        ).toBeInTheDocument();
    });
});

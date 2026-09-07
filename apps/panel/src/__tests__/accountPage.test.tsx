import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import AccountPage from '@/pages/account';
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

jest.mock('@/components/salon/SalonBreadcrumbs', () => ({
    __esModule: true,
    default: () => <nav aria-label="breadcrumb" />,
}));

jest.mock('@/components/ui/PanelSection', () => ({
    __esModule: true,
    default: ({
        title,
        children,
    }: {
        title: string;
        children: React.ReactNode;
    }) => (
        <section>
            <h2>{title}</h2>
            {children}
        </section>
    ),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AccountPage', () => {
    it('renders editable CRM profile fields and submits them to profile API', async () => {
        const apiFetch = jest.fn().mockResolvedValue({});
        const refreshProfile = jest.fn().mockResolvedValue(undefined);
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: apiFetch as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
                refreshProfile,
                user: {
                    id: 1,
                    email: 'client@example.com',
                    name: 'Test User',
                    role: 'client',
                    phone: '500600700',
                    firstName: 'Test',
                    lastName: 'User',
                    birthDate: '1990-05-10',
                    gender: 'female',
                    address: 'Prosta 1',
                    city: 'Warszawa',
                    postalCode: '00-001',
                    description: 'Preferuje poranki',
                    receiveNotifications: true,
                    notifyPanel: true,
                    notifySms: false,
                    notifyWhatsapp: false,
                    notifyEmail: true,
                    smsConsent: false,
                    whatsappConsent: false,
                    emailConsent: false,
                },
            }),
        );

        render(<AccountPage />);

        expect(
            screen.getByRole('heading', { name: 'Powiadomienia o wizytach' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Zgody marketingowe' }),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('E-mail — informacje o wizytach'),
        ).toBeChecked();
        expect(
            screen.getByLabelText('Marketing przez e-mail'),
        ).not.toBeChecked();

        fireEvent.click(
            screen.getByLabelText('WhatsApp — informacje o wizytach'),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Zapisz powiadomienia' }),
        );

        await waitFor(() =>
            expect(apiFetch).toHaveBeenCalledWith(
                '/users/profile/consent',
                expect.objectContaining({ method: 'PATCH' }),
            ),
        );
        const consentCall = apiFetch.mock.calls.find(
            ([endpoint, init]) =>
                endpoint === '/users/profile/consent' &&
                (init as RequestInit | undefined)?.method === 'PATCH',
        );
        expect(
            JSON.parse((consentCall?.[1] as RequestInit).body as string),
        ).toEqual({
            receiveNotifications: true,
            notifyPanel: true,
            notifySms: false,
            notifyWhatsapp: true,
            notifyEmail: true,
            smsConsent: false,
            whatsappConsent: false,
            emailConsent: false,
        });
        expect(screen.getByLabelText('Imię')).toHaveValue('Test');
        expect(screen.getByLabelText('Nazwisko')).toHaveValue('User');
        expect(screen.getByLabelText('Data urodzenia')).toHaveValue(
            '1990-05-10',
        );
        // pole "Informacje dla salonu" (description) jest CRM-owe, staff-only —
        // klient nie może go edytować
        expect(
            screen.queryByLabelText('Informacje dla salonu'),
        ).not.toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Miasto'), {
            target: { value: 'Kraków' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz dane' }));

        await waitFor(() =>
            expect(apiFetch).toHaveBeenCalledWith(
                '/users/profile',
                expect.objectContaining({ method: 'PATCH' }),
            ),
        );
        // Find the profile PATCH explicitly — the page also fires unrelated
        // calls on mount (e.g. the push VAPID lookup), so a positional index
        // silently breaks whenever another section is added.
        const profileCall = apiFetch.mock.calls.find(
            ([endpoint, init]) =>
                endpoint === '/users/profile' &&
                (init as RequestInit | undefined)?.method === 'PATCH',
        );
        const body = JSON.parse(
            (profileCall?.[1] as RequestInit).body as string,
        );
        expect(body).not.toHaveProperty('description');
        expect(body).toEqual(
            expect.objectContaining({
                name: 'Test User',
                firstName: 'Test',
                lastName: 'User',
                city: 'Kraków',
            }),
        );
        expect(refreshProfile).toHaveBeenCalled();
    });
});

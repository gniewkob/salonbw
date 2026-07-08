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
                },
            }),
        );

        render(<AccountPage />);

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
        const body = JSON.parse(apiFetch.mock.calls[0][1].body as string);
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

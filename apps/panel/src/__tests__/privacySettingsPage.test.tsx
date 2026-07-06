import { render, screen } from '@testing-library/react';
import React from 'react';
import PrivacySettingsPage from '@/pages/settings/privacy';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        query: {},
        pathname: '/settings/privacy',
    }),
}));

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
    it('renders informational RODO tab pointing personal consents to /account', () => {
        const apiFetch = jest.fn();
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

        // The salon settings page no longer edits the logged-in user's own
        // marketing consent (that lives on /account) — it is informational.
        expect(
            screen.getByRole('heading', { name: /Twoje prawa \(RODO/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Moim koncie/i }),
        ).toHaveAttribute('href', '/account');

        // No personal-consent save button, and no consent PATCH is issued.
        expect(
            screen.queryByRole('button', { name: 'Zapisz ustawienia' }),
        ).not.toBeInTheDocument();
        expect(
            apiFetch.mock.calls.some(
                ([path]) => path === '/users/profile/consent',
            ),
        ).toBe(false);
    });
});

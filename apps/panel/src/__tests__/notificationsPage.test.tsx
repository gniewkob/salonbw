import { render, screen, within } from '@testing-library/react';
import NotificationsPage from '@/pages/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/useNotifications');

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

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseNotifications = useNotifications as jest.MockedFunction<
    typeof useNotifications
>;

describe('NotificationsPage', () => {
    beforeEach(() => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
                isAuthenticated: true,
                apiFetch: jest.fn() as never,
            }),
        );
    });

    it('links reschedule notifications to the exact visit action', () => {
        mockedUseNotifications.mockReturnValue({
            data: [
                {
                    id: 'client-42',
                    type: 'reschedule_action',
                    appointmentId: 42,
                    message:
                        'Salon zaproponował nowy termin wizyty Koloryzacja — 15 lip, 14:30. Potwierdź zmianę.',
                    createdAt: '2026-07-15T14:30:00.000Z',
                    actionHref: '/visits?visitId=42',
                    actionLabel: 'Sprawdź i zaakceptuj',
                },
            ],
            isLoading: false,
            isError: false,
        } as never);

        render(<NotificationsPage />);

        const item = screen
            .getByText(/Salon zaproponował nowy termin wizyty Koloryzacja/)
            .closest('article');

        expect(item).not.toBeNull();
        expect(
            within(item!).getByRole('link', {
                name: /Salon zaproponował nowy termin wizyty Koloryzacja/,
            }),
        ).toHaveAttribute('href', '/visits?visitId=42');
        expect(
            within(item!).getByRole('link', {
                name: 'Sprawdź i zaakceptuj',
            }),
        ).toHaveAttribute('href', '/visits?visitId=42');
    });
});

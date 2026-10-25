import { render, screen } from '@testing-library/react';
import DashboardPage from '@/pages/dashboard';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');
jest.mock(
    '@/components/RouteGuard',
    () =>
        function MockGuard({ children }: { children: React.ReactNode }) {
            return <>{children}</>;
        },
);
jest.mock(
    '@/components/salon/SalonShell',
    () =>
        function MockShell({ children }: { children: React.ReactNode }) {
            return <>{children}</>;
        },
);
jest.mock('next/dynamic', () => (load: () => unknown) => {
    const source = load.toString();
    const name = source.includes('SystemDashboard')
        ? 'technical dashboard'
        : source.includes('ClientDashboard')
          ? 'client dashboard'
          : 'salon dashboard';
    return function MockDashboard() {
        return <div>{name}</div>;
    };
});

it.each([
    ['admin', true, 'technical dashboard'],
    ['admin', false, 'salon dashboard'],
    ['client', true, 'client dashboard'],
])(
    'selects the correct dashboard for %s (technical=%s)',
    (role, isSystemAdmin, expected) => {
        (useAuth as jest.Mock).mockReturnValue({
            role,
            user: { role, isSystemAdmin },
        });
        render(<DashboardPage />);
        expect(screen.getByText(expected as string)).toBeInTheDocument();
    },
);

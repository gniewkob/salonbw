import { render, screen } from '@testing-library/react';
import SystemDashboard from '@/components/dashboard/SystemDashboard';
import { useSystemStatus } from '@/hooks/useSystemStatus';

jest.mock('@/hooks/useSystemStatus');
const mockStatus = useSystemStatus as jest.Mock;
const data = {
    checkedAt: '2026-10-25T10:00:00.000Z',
    status: 'degraded',
    api: { status: 'ok', uptimeSeconds: 123, revision: null },
    services: {
        database: { status: 'ok', latencyMs: 1 },
        smtp: { status: 'error', latencyMs: 2 },
        instagram: { status: 'skipped', latencyMs: 0 },
    },
    notifications: { deliveryVerification: 'unknown' },
};

it('shows technical failures and unknown data without salon revenue or bookings', () => {
    mockStatus.mockReturnValue({
        data,
        isPending: false,
        isFetching: false,
        isError: false,
        refetch: jest.fn(),
    });
    render(<SystemDashboard />);
    expect(
        screen.getByRole('heading', { name: 'Stan systemu' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Awaria')).toBeInTheDocument();
    expect(screen.getByText('Nie skonfigurowano')).toBeInTheDocument();
    expect(screen.getByText('Brak metadanych wydania')).toBeInTheDocument();
    expect(
        screen.getByText(/połączenie SMTP nie potwierdza dostarczenia/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Przychód/)).not.toBeInTheDocument();
});
it('hides the previous snapshot when refreshing fails', () => {
    mockStatus.mockReturnValue({
        data,
        isPending: false,
        isFetching: false,
        isError: true,
        refetch: jest.fn(),
    });
    render(<SystemDashboard />);
    expect(screen.getByRole('alert')).toHaveTextContent(
        'Nie udało się pobrać aktualnego stanu systemu',
    );
    expect(screen.queryByText('Sprawne')).not.toBeInTheDocument();
});

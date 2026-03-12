import { render, screen } from '@testing-library/react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

jest.mock('@/hooks/useDashboard', () => ({
    useDashboard: jest.fn(() => ({
        loading: false,
        data: {
            upcomingAppointments: [
                {
                    id: 1,
                    startTime: '2026-03-12T10:00:00.000Z',
                    client: { id: 2, name: 'Jan Kowalski' },
                    service: { id: 3, name: 'Strzyżenie' },
                },
            ],
        },
    })),
}));

jest.mock('@/hooks/useStatistics', () => ({
    useDashboardStats: jest.fn(() => ({
        isLoading: false,
        data: {
            todayRevenue: 300,
            todayProductRevenue: 80,
            todayAppointments: 4,
            todayCompletedAppointments: 3,
            todayNewClients: 2,
            weekRevenue: 1200,
            weekProductRevenue: 250,
            weekAppointments: 12,
            monthRevenue: 4200,
            monthProductRevenue: 700,
            monthAppointments: 40,
            pendingAppointments: 5,
            averageRating: 4.7,
            monthDailyAppointments: [
                { date: '2026-03-11', count: 2 },
                { date: '2026-03-12', count: 4 },
            ],
            monthDailyNewClients: [
                { date: '2026-03-11', count: 1 },
                { date: '2026-03-12', count: 2 },
            ],
            monthDailyRevenue: [
                {
                    date: '2026-03-11',
                    serviceRevenue: 150,
                    productRevenue: 50,
                    totalRevenue: 200,
                },
                {
                    date: '2026-03-12',
                    serviceRevenue: 220,
                    productRevenue: 80,
                    totalRevenue: 300,
                },
            ],
        },
    })),
}));

describe('AdminDashboard', () => {
    it('renders real revenue and trend values instead of placeholder controls', () => {
        render(<AdminDashboard />);

        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('300,00 zł')).toBeInTheDocument();
        expect(screen.getAllByText('+100%')).toHaveLength(2);
        expect(screen.getByText('+50%')).toBeInTheDocument();
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        expect(screen.queryByText('pokaż obrót')).not.toBeInTheDocument();
    });
});

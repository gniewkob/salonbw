import { render, screen, waitFor } from '@testing-library/react';
import StatisticsPage from '@/pages/statistics';
import CommissionsPage from '@/pages/statistics/commissions';
import EmployeeActivityPage from '@/pages/statistics/employees';

const mockApiFetch = jest.fn();
const mockUseCashRegister = jest.fn();
const mockUseCommissionReport = jest.fn();
const mockUseEmployeeRanking = jest.fn();
const mockUseEmployees = jest.fn();
const mockUseRevenueChart = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        role: 'admin',
        isAuthenticated: true,
        initialized: true,
        apiFetch: mockApiFetch,
    }),
}));

jest.mock('@/hooks/useEmployees', () => ({
    useEmployees: () => mockUseEmployees(),
}));

jest.mock('@/hooks/useStatistics', () => ({
    useCashRegister: () => mockUseCashRegister(),
    useCommissionReport: () => mockUseCommissionReport(),
    useEmployeeRanking: () => mockUseEmployeeRanking(),
    useRevenueChart: () => mockUseRevenueChart(),
}));

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
    default: () => <div data-testid="breadcrumbs" />,
}));

jest.mock('@/components/statistics/StatisticsPieChart', () => ({
    __esModule: true,
    default: () => <div data-testid="statistics-pie-chart" />,
}));

jest.mock('@/components/statistics/StatisticsToolbar', () => ({
    __esModule: true,
    default: () => <div data-testid="statistics-toolbar" />,
}));

const emptyTotals = {
    serviceRevenue: 0,
    serviceCommission: 0,
    productRevenue: 0,
    productCommission: 0,
    totalRevenue: 0,
    totalCommission: 0,
};

const resetStatisticsMocks = () => {
    mockUseEmployees.mockReturnValue({ data: [] });
    mockUseEmployeeRanking.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
    });
    mockUseCommissionReport.mockReturnValue({
        data: { employees: [], totals: emptyTotals },
        isLoading: false,
        error: null,
    });
    mockUseRevenueChart.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
    });
    mockUseCashRegister.mockReturnValue({
        data: { totals: {} },
        isLoading: false,
        error: null,
    });
};

describe('statistics employee rows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetStatisticsMocks();
        mockApiFetch.mockResolvedValue({
            date: '2026-07-20',
            employees: [],
            totals: {
                workTimeMinutes: 0,
                appointmentsCount: 0,
            },
        });
    });

    it('does not backfill fabricated employees on the main statistics page', () => {
        render(<StatisticsPage />);

        const page = screen.getByTestId('statistics-page');
        expect(page).not.toHaveTextContent('Recepcja');
        expect(page).not.toHaveTextContent('Gniewko Bodora');
        expect(page).not.toHaveTextContent('Aleksandra Bodora');
    });

    it('shows only real employees as zero rows on the commissions page', () => {
        mockUseEmployees.mockReturnValue({
            data: [{ id: 7, fullName: 'Aleksandra Bodora' }],
        });

        render(<CommissionsPage />);

        const page = screen.getByTestId('commissions-page');
        expect(page).toHaveTextContent('Aleksandra Bodora');
        expect(page).not.toHaveTextContent('Recepcja');
        expect(page).not.toHaveTextContent('Gniewko Bodora');
    });

    it('renders an empty employee activity state instead of a fabricated employee', async () => {
        render(<EmployeeActivityPage />);

        await waitFor(() =>
            expect(
                screen.getByTestId('employee-activity-page'),
            ).toHaveTextContent('Brak aktywności pracowników'),
        );

        const page = screen.getByTestId('employee-activity-page');
        expect(page).not.toHaveTextContent('Aleksandra Bodora');
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\/statistics\/employees\/activity\?date=\d{4}-\d{2}-\d{2}$/,
            ),
        );
    });
});

import { fireEvent, render, screen } from '@testing-library/react';
import StudioV18Page from '@/pages/studio-v18';
import { useBookableEmployees } from '@/hooks/useEmployees';

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1 } }),
}));
jest.mock('@/hooks/useEmployees', () => ({ useBookableEmployees: jest.fn() }));
jest.mock('@/hooks/useDashboard', () => ({
    useDashboard: () => ({ data: null, loading: false }),
}));
jest.mock('@/hooks/useStatistics', () => ({
    useDashboardStats: () => ({ data: null, isLoading: false }),
}));
jest.mock('@/hooks/useStockAlerts', () => ({
    useStockSummary: () => ({ data: null, isLoading: false }),
}));
jest.mock('recharts', () => {
    const React = require('react');
    return new Proxy(
        {},
        {
            get:
                () =>
                ({ children }: { children?: React.ReactNode }) =>
                    React.createElement('div', null, children),
        },
    );
});

const setRoster = (
    data: Array<{ id: number; name: string }> | null,
    loading = false,
    error: Error | null = null,
) =>
    jest
        .mocked(useBookableEmployees)
        .mockReturnValue({ data, loading, error } as ReturnType<
            typeof useBookableEmployees
        >);

test('hides team card and shortcut for one provider', () => {
    setRoster([{ id: 7, name: 'Osoba' }]);
    render(<StudioV18Page />);
    expect(
        screen.queryByRole('heading', { name: 'Zespół' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Moje moduły' }));
    expect(
        screen.queryByText('Pracownicy i ich grafiki'),
    ).not.toBeInTheDocument();
});

test('retains team controls for multiple providers', () => {
    setRoster([
        { id: 7, name: 'Osoba' },
        { id: 8, name: 'Druga osoba' },
    ]);
    render(<StudioV18Page />);
    expect(screen.getByRole('heading', { name: 'Zespół' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Moje moduły' }));
    expect(screen.getByText('Pracownicy i ich grafiki')).toBeInTheDocument();
});

test('does not infer a single provider when roster fails', () => {
    setRoster(null, false, new Error('unavailable'));
    render(<StudioV18Page />);
    expect(screen.getByText('Nie można pobrać zespołu')).toBeInTheDocument();
});

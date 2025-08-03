import { render, screen } from '@testing-library/react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DashboardNav receptionist', () => {
  it('shows receptionist links', () => {
    mockedUseAuth.mockReturnValue({ logout: jest.fn(), role: 'receptionist' } as any);
    render(<DashboardNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });
});

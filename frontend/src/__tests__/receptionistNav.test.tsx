import { render, screen } from '@testing-library/react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('DashboardNav receptionist', () => {
  it('shows receptionist links', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'receptionist' }));
    render(<DashboardNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });
});

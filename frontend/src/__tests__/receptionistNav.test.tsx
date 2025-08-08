import { render, screen } from '@testing-library/react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseRouter = useRouter as jest.Mock;

describe('DashboardNav receptionist', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedUseRouter.mockReset();
  });

  it('shows receptionist links', () => {
    mockedUseAuth.mockReturnValue(createAuthValue({ role: 'receptionist' }));
    mockedUseRouter.mockReturnValue({ pathname: '/dashboard/receptionist' });
    render(<DashboardNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });
});

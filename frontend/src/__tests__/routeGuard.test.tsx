import { render, screen } from '@testing-library/react';
import React from 'react';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';

const replace = jest.fn();
jest.mock('next/router', () => ({ useRouter: () => ({ replace, push: jest.fn() }) }));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RouteGuard', () => {
  beforeEach(() => {
    replace.mockClear();
  });
  it('redirects when unauthenticated', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false } as any);
    render(
      <RouteGuard>
        <div>Secret</div>
      </RouteGuard>
    );
    expect(replace).toHaveBeenCalledWith('/auth/login');
    expect(screen.queryByText('Secret')).toBeNull();
  });

  it('renders children when authenticated and role allowed', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, role: 'receptionist' } as any);
    render(
      <RouteGuard roles={['receptionist']}>
        <div>Secret</div>
      </RouteGuard>
    );
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects when role not permitted', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, role: 'client' } as any);
    render(
      <RouteGuard roles={['admin']}>
        <div>Secret</div>
      </RouteGuard>
    );
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });
});

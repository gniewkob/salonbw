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
    expect(replace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Secret')).toBeNull();
  });

  it('renders children when authenticated', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true } as any);
    render(
      <RouteGuard>
        <div>Secret</div>
      </RouteGuard>
    );
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});

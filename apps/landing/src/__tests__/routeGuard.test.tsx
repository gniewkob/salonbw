import { render, screen } from '@testing-library/react';
import React from 'react';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const replace = jest.fn().mockResolvedValue(true);
jest.mock('next/router', () => ({
    useRouter: () => ({ replace, push: jest.fn() }),
}));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RouteGuard', () => {
    beforeEach(() => {
        replace.mockClear();
    });
    it('redirects when unauthenticated', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({ isAuthenticated: false }),
        );
        render(
            <RouteGuard>
                <div>Secret</div>
            </RouteGuard>,
        );
        expect(replace).toHaveBeenCalledWith(
            'https://panel.salon-bw.pl/auth/login',
        );
        expect(screen.queryByText('Secret')).toBeNull();
    });

    it('does not redirect before initialization', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({ isAuthenticated: false, initialized: false }),
        );
        render(
            <RouteGuard>
                <div>Secret</div>
            </RouteGuard>,
        );
        expect(replace).not.toHaveBeenCalled();
        expect(screen.queryByText('Secret')).toBeNull();
    });

    it('renders children when authenticated and role allowed', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({ isAuthenticated: true, role: 'receptionist' }),
        );
        render(
            <RouteGuard roles={['receptionist']}>
                <div>Secret</div>
            </RouteGuard>,
        );
        expect(replace).not.toHaveBeenCalled();
        expect(screen.getByText('Secret')).toBeInTheDocument();
    });

    it('renders Forbidden when role not permitted', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({ isAuthenticated: true, role: 'client' }),
        );
        render(
            <RouteGuard roles={['admin']}>
                <div>Secret</div>
            </RouteGuard>,
        );
        expect(replace).not.toHaveBeenCalled();
        expect(
            screen.getByText("You don't have permission to access this area."),
        ).toBeInTheDocument();
    });
});

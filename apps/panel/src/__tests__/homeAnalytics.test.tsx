import { render, waitFor } from '@testing-library/react';
import React from 'react';
import HomePage from '@/pages/index';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';
const replace = jest.fn();
jest.mock('next/router', () => ({
    useRouter: () => ({ replace }),
}));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Home redirect', () => {
    beforeEach(() => {
        replace.mockClear();
        mockedUseAuth.mockReset();
    });

    it('redirects to calendar for admin role', async () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                initialized: true,
                isAuthenticated: true,
                role: 'admin',
            }),
        );
        render(<HomePage />);
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/calendar'));
    });

    it('redirects to login when not authenticated', async () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                initialized: true,
                isAuthenticated: false,
                role: null,
            }),
        );
        render(<HomePage />);
        await waitFor(() =>
            expect(replace).toHaveBeenCalledWith('/auth/login'),
        );
    });
});

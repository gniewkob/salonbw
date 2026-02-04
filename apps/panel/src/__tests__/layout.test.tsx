import { render, screen } from '@testing-library/react';
import React from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@/contexts/AuthContext');

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Layout', () => {
    beforeEach(() => {
        mockedUseRouter.mockReset();
        mockedUseAuth.mockReset();
    });

    it('renders Navbar on public routes', () => {
        mockedUseRouter.mockReturnValue({ pathname: '/contact' });
        mockedUseAuth.mockReturnValue(createAuthValue());
        render(<Layout>content</Layout>);
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders dashboard navigation on private routes', () => {
        mockedUseRouter.mockReturnValue({ pathname: '/products' });
        mockedUseAuth.mockReturnValue(
            createAuthValue({ isAuthenticated: true, role: 'admin' }),
        );
        render(<Layout>content</Layout>);
        expect(screen.getByText('magazyn')).toBeInTheDocument();
    });
});

import { render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('@/contexts/AuthContext');

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const createRouterMock = (pathname: string) => ({
    pathname,
    query: {},
    events: { on: jest.fn(), off: jest.fn() },
});
const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
};

describe('Layout', () => {
    beforeEach(() => {
        mockedUseRouter.mockReset();
        mockedUseAuth.mockReset();
    });

    it('renders Navbar on public routes', () => {
        mockedUseRouter.mockReturnValue(createRouterMock('/contact'));
        mockedUseAuth.mockReturnValue(createAuthValue());
        renderWithQueryClient(<Layout>content</Layout>);
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders dashboard navigation on private routes', () => {
        mockedUseRouter.mockReturnValue(createRouterMock('/products'));
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                isAuthenticated: true,
                role: 'admin',
                apiFetch: jest.fn().mockResolvedValue([]) as ReturnType<
                    typeof createAuthValue
                >['apiFetch'],
            }),
        );
        renderWithQueryClient(<Layout>content</Layout>);
        expect(screen.getByText('magazyn')).toBeInTheDocument();
    });
});

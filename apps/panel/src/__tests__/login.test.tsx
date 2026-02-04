import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginPage from '@/pages/auth/login';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

const push = jest.fn();
jest.mock('next/router', () => ({
    useRouter: () => ({ push, replace: jest.fn(), query: {} }),
}));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginPage', () => {
    beforeEach(() => {
        push.mockClear();
    });

    it('submits valid form', async () => {
        const login = jest.fn().mockResolvedValue(undefined);
        const apiFetch = jest.fn().mockResolvedValue({ role: 'admin' });
        mockedUseAuth.mockReturnValue(createAuthValue({ login, apiFetch }));
        render(<LoginPage />);
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'a@b.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'secret' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
        await waitFor(() => expect(login).toHaveBeenCalled());
        await waitFor(() => expect(apiFetch).toHaveBeenCalled());
        expect(push).toHaveBeenCalledWith('/calendar');
    });

    it('shows validation error', async () => {
        const login = jest.fn();
        mockedUseAuth.mockReturnValue(createAuthValue({ login }));
        render(<LoginPage />);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        fireEvent.change(emailInput, { target: { value: 'bad' } });
        fireEvent.blur(emailInput);
        fireEvent.change(passwordInput, { target: { value: '' } });
        fireEvent.blur(passwordInput);
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
        expect(login).not.toHaveBeenCalled();
    });
});
